// Dependencies
const Botkit = require('botkit');
const moment = require('moment');
const _ = require('lodash');
const chrono = require('chrono-node');
const franc = require('franc-min');

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
    return {
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
};

/**
 * Try to guess a date from the message using NLP (Natural Language Processsing).
 *
 * @param {Object} message the message object from Slack.
 * @return {?Date} The processed date, or null.
 */
const extractDate = (message = {}) => {

    const text = message.text;
    if (_.isNil(text)) {
        return null;
    }

    // Use the chrono library to process the text and guess the date.
    const result = chrono.parse(text);

    if (_.isEmpty(result)) {
        return null;
    } else {
        const date = result[0].start.date();
        return date;
    }

};

/**
 * Try to detect the language of the message using NLP (Natural Language Processsing).
 *
 * @param {Object} message the message object from Slack.
 * @return {String} The language.
 */
const detectLanguage = (message = {}) => {

    const text = message.text;
    if (_.isNil(text)) {
        return 'eng';
    }

    // Use the franc library to process the text and try to guess the language
    const language = franc(text, {
        whitelist: ['eng', 'fra'],
        minLength: 3
    });

    return language;
}

/**
 * Export a function allowing to pass parameters
 */
module.exports = (EBXLicensesProvider, token) => {

    // Define the slackbot controller
    const controller = Botkit.slackbot({
        retry: Infinity,
        stats_optout: true,
        debug: false
    });

    // Start connecting to Slack
    controller.spawn({
        token: token
    }).startRTM();

    // Define the middleware that will extract a date information from the message
    controller.middleware.heard.use((bot, message, next) => {

        // Try to extract a date from the message text
        const date = extractDate(message);

        if (date) {
            message.expiration = date;
        } else {
            message.expiration = null;
        }

        next();
    });

    // -------------------------------------------------------------------------
    // Listen to messages from Slack
    // -------------------------------------------------------------------------

    // Focus on direct message with the words license (en) and licence (fr)
    controller.hears(['license', 'licence'],['direct_message'],(bot,message) => {

        // Try to guess the language to reply in the same one
        const language = detectLanguage(message);

        //
        EBXLicensesProvider.getLicense(message.expiration).then((license) => {
            bot.reply(message, formatLicense(license, messages('BOT_001', language), language));
        }).catch((err) => {
            bot.reply(message, messages('BOT_ERR', language));
        });

    });

    // Focus on mentions with the words license (en) and licence (fr)
    // Different from direct message, as it's in multi-user channel, the reply
    // will mention the user requesting the license
    controller.hears(['license', 'licence'],['direct_mention','mention'],(bot,message) => {

        // Try to guess the language to reply in the same one
        const language = detectLanguage(message);
        const replyMessage = messages('BOT_001', language);

        //
        EBXLicensesProvider.getLicense(message.expiration).then((license) => {
            bot.reply(message, formatLicense(license, `<@${message.user}>, ${replyMessage}`, language));
        }).catch((err) => {
            bot.reply(message, messages('BOT_ERR', language));
        });

    });

    // Focus on ambient message (not explicitly mentionning the bot) with the words
    // license (en) and licence (fr)
    // the reply will mention the user requesting the license
    controller.hears(['license', 'licence'],['ambient'],(bot,message) => {

        // Try to guess the language to reply in the same one
        const language = detectLanguage(message);
        const replyMessage = messages('BOT_002', language);

        //
        EBXLicensesProvider.getLicense(message.expiration).then((license) => {
            bot.reply(message, formatLicense(license, `<@${message.user}>, ${replyMessage}`, language));
        }).catch((err) => {
            console.error(err);
            bot.reply(message, messages('BOT_ERR', language));
        });

    });

    // If the bot is mentionned or ask in any other case, reply that it can't handle
    controller.on(['direct_message','direct_mention','mention'],(bot,message) => {

        // Try to guess the language to reply in the same one
        const language = detectLanguage(message);
        bot.reply(message, messages('BOT_CONV', language));

    });

};
