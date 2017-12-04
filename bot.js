// Dependencies
const Botkit = require('botkit');
const moment = require('moment');
const _ = require('lodash');
const chrono = require('chrono-node');
const franc = require('franc-min');

// Get the loggers
const botLogger = require('winston').loggers.get('BOT');
const nlpLogger = require('winston').loggers.get('NLP');

// Factory for localized messages
const messages = require('./messages');

/**
 * Format the reply message to display the license information.
 *
 * @param {License} license The license object.
 * @param {String} pretext Text to be added to the formatted license information.
 * @param {String} [language = 'eng'] The language of the formatted message.
 */
const formatLicense = (license, pretext, language = 'eng') => {

    botLogger.log('verbose', `Formatting the license to be returned through Slack`);

    const today = moment().startOf('day');
    const generationDate = moment(license.generationDate);
    const expirationDate = moment(license.expirationDate);

    // Get the localized title for the key information
    const keyTitle = messages('BOT_003', language);
    // Get the localized and customized titles for the dates information
    const generationDays = Math.abs(generationDate.diff(today, 'days', true));
    const generationTitle = messages('BOT_004', language, generationDays);
    const expirationTitle = messages('BOT_005', language, license.nbValidDays);

    // Return the formatted information
    let formattedReply = {
        'attachments': [
            {
                'pretext': pretext,
    			'color': '#262C72', // Blue color from Orchestra Networks
    			'fields': [
                    {
                        'title': keyTitle,
                        'value': license.key,
                        'short': false
                    },
    				{
                        'title': generationTitle,
                        'value': generationDate.format('YYYY-MM-DD'),
                        'short': true
                    },
    				{
                        'title': expirationTitle,
                        'value': expirationDate.format('YYYY-MM-DD'),
                        'short': true
                    }
                ]
            }
        ]
    };

    botLogger.log('debug', `Formatted message`, formattedReply);

    return formattedReply;
};

/**
 * Try to guess a date from the message using NLP (Natural Language Processsing).
 *
 * @param {Object} message the message object from Slack.
 * @return {?Date} The processed date, or null.
 */
const extractDate = (message = {}) => {

    botLogger.log('verbose', 'Extracting date from message');

    const text = message.text;
    if (_.isNil(text)) {
        return null;
    }

    // Use the chrono library to process the text and guess the date.
    const result = chrono.parse(text);

    let returnedDate = null
    if (!_.isEmpty(result)) {
        const date = result[0].start.date();
        returnedDate = date;
    }

    nlpLogger.info({
        'text': text,
        'date' : returnedDate
    });

    return returnedDate;
};

/**
 * Try to detect the language of the message using NLP (Natural Language Processsing).
 *
 * @param {Object} message the message object from Slack.
 * @return {String} The language.
 */
const detectLanguage = (message = {}) => {

    botLogger.log('verbose', 'Detecting language from message');

    const text = message.text;
    if (_.isNil(text)) {
        return 'eng';
    }

    // Use the franc library to process the text and try to guess the language
    const language = franc(text, {
        whitelist: ['eng', 'fra'],
        minLength: 3
    });

    nlpLogger.info({
        'text': text,
        'language' : language
    });

    return language;
}

/**
 * Exports a function allowing to pass parameters
 * @param  {EBXLicenseProvider} EBXLicensesProvider The license provider.
 * @param  {String}             token               The Slack token.
 * @return {Function}
 */
module.exports = (EBXLicensesProvider, token) => {

    // Define the slackbot controller
    botLogger.log('verbose', 'Defining the Slackbot controller');
    const controller = Botkit.slackbot({
        retry: Infinity,
        stats_optout: true,
        debug: true,
        logger: botLogger});

    // Start connecting to Slack
    botLogger.log('verbose', 'Spawing the Slackbot');
    botLogger.log('debug', `Slack token: ${token}`);
    controller.spawn({
        token: token
    }).startRTM();

    // Define the middleware that will extract a date information from the message
    botLogger.log('verbose', 'Setting up the heard middleware extracting the date from message');
    controller.middleware.heard.use((bot, message, next) => {

        botLogger.log('verbose', 'Heard middleware: Extracting date info from message');

        // Try to extract a date from the message text
        const date = extractDate(message);

        if (date) {
            message.expiration = date;
            botLogger.log('debug', `Extracted date: ${date} from ${message.text}`);
        } else {
            message.expiration = null;
            botLogger.log('debug', `No extracted date from ${message.text}`);
        }

        next();
    });

    // -------------------------------------------------------------------------
    // Listen to messages from Slack
    // -------------------------------------------------------------------------

    botLogger.log('verbose', 'Defining the event listeners');

    // Focus on direct message with the words license (en) and licence (fr)
    botLogger.log('verbose', 'Defining event listener focus on direct message with the words license (en) and licence (fr)');
    controller.hears(['license', 'licence'],['direct_message'],(bot,message) => {

        botLogger.log('info', 'Get a direct message with license keywords');

        // Try to guess the language to reply in the same one
        const language = detectLanguage(message);
        botLogger.log('debug', `Using ${language} language`);

        // Requesting license provider for a license
        botLogger.log('verbose', `Requesting license provider for a license`);
        botLogger.log('debug', `Requesting license expiration ${message.expiration}`);

        EBXLicensesProvider.getLicense(message.expiration).then((license) => {

            botLogger.log('verbose', `Provider returned requested license`);
            botLogger.log('debug', 'License:', license);

            botLogger.log('verbose', 'Replying with a formatted message displaying the license');
            bot.reply(message, formatLicense(license, messages('BOT_001', language), language));

        }).catch((err) => {

            // TODO handle error
            botLogger.log('error', 'Provider returned an error on getLicense(expiration)', err);

            botLogger.log('verbose', 'Replying with an error message');
            bot.reply(message, messages('BOT_ERR', language));

        });

    });

    // Focus on mentions with the words license (en) and licence (fr)
    // Different from direct message, as it's in multi-user channel, the reply
    // will mention the user requesting the license
    botLogger.log('verbose', 'Defining event listener focus on mentions with the words license (en) and licence (fr)');
    controller.hears(['license', 'licence'],['direct_mention','mention'],(bot,message) => {

        botLogger.log('info', 'Get a mention with license keywords');

        // Try to guess the language to reply in the same one
        const language = detectLanguage(message);
        botLogger.log('debug', `Using ${language} language`);

        const replyMessage = messages('BOT_001', language);

        // Requesting license provider for a license
        botLogger.log('verbose', `Requesting license provider for a license`);
        botLogger.log('debug', `Requesting license expiration ${message.expiration}`);

        EBXLicensesProvider.getLicense(message.expiration).then((license) => {

            botLogger.log('verbose', `Provider returned requested license`);
            botLogger.log('debug', 'License:', license);

            botLogger.log('verbose', 'Replying with a formatted message displaying the license');
            bot.reply(message, formatLicense(license, `<@${message.user}>, ${replyMessage}`, language));

        }).catch((err) => {

            // TODO handle error
            botLogger.log('error', 'Provider return an error on getLicense(expiration)', err);

            botLogger.log('verbose', 'Replying with an error message');
            bot.reply(message, messages('BOT_ERR', language));

        });

    });

    // Focus on ambient message (not explicitly mentionning the bot) with the words
    // license (en) and licence (fr)
    // the reply will mention the user requesting the license
    botLogger.log('verbose', 'Defining event listener focus on ambient message with the words license (en) and licence (fr)');
    controller.hears(['license', 'licence'],['ambient'],(bot,message) => {

        botLogger.log('Heard a license keyword in ambient message');

        // Try to guess the language to reply in the same one
        const language = detectLanguage(message);
        botLogger.log('debug', `Using ${language} language`);

        const replyMessage = messages('BOT_002', language);

        // Requesting license provider for a license
        botLogger.log('verbose', `Requesting license provider for a license`);
        botLogger.log('debug', `Requesting license expiration ${message.expiration}`);

        EBXLicensesProvider.getLicense(message.expiration).then((license) => {

            botLogger.log('verbose', `Provider returned requested license`);
            botLogger.log('debug', 'License:', license);

            botLogger.log('verbose', 'Replying with a formatted message displaying the license');
            bot.reply(message, formatLicense(license, `<@${message.user}>, ${replyMessage}`, language));

        }).catch((err) => {

            // TODO handle error
            botLogger.log('error', 'Provider return an error on getLicense(expiration)', err);

            botLogger.log('verbose', 'Replying with an error message');
            bot.reply(message, messages('BOT_ERR', language));

        });

    });

    // If the bot is mentionned or ask in any other case, reply that it can't handle
    botLogger.log('verbose', 'Defining event listener for all direct message and mentions without the keywords license (en) or licence (fr)');
    controller.on(['direct_message','direct_mention','mention'],(bot,message) => {

        botLogger.log('Get a direct message or mention but without a license keywords');

        // Try to guess the language to reply in the same one
        const language = detectLanguage(message);
        botLogger.log('debug', `Using ${language} language`);

        bot.reply(message, messages('BOT_CONV', language));

    });

};
