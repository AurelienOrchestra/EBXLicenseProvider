const Botkit = require('botkit');
const moment = require('moment');
const _ = require('lodash');
const chrono = require('chrono-node');
const franc = require('franc-min');
const messages = require('./messages');

const formatLicense = (license, pretext, language) => {

    const today = moment().startOf('day');
    const generationDate = moment(license.generationDate);
    const expirationDate = moment(license.expirationDate);

    const keyTitle = messages('BOT_003', language);
    const generationDays = Math.abs(generationDate.diff(today, 'days', true));
    const generationTitle = messages('BOT_004', language, generationDays);
    const expirationTitle = messages('BOT_005', language, license.nbValidDays);

    return {
        'attachments': [
            {
                'pretext': pretext,
    			'color': '#262C72',
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

const extractDate = (text) => {

    const result = chrono.parse(text);

    if (_.isEmpty(result)) {
        return null;
    } else {
        const date = result[0].start.date();
        return date;
    }

};

const detectLanguage = (message) => {

    const text = message.text;
    if (_.isNil(text)) {
        return 'eng';
    }

     return franc(text, {
         whitelist: ['eng', 'fra'],
         minLength: 3
     });
}

module.exports = (EBXLicensesProvider, token) => {

    const controller = Botkit.slackbot({
        retry: Infinity,
        stats_optout: true,
        debug: false
    });

    controller.spawn({
        token: token
    }).startRTM();

    controller.middleware.heard.use((bot, message, next) => {

        const text = message.text;
        if (_.isNil(text)) {
            return;
        }

        const date = extractDate(text);

        if (date) {
            message.expiration = date;
        } else {
            message.expiration = null;
        }

        next();
    });

    controller.hears(['license', 'licence'],['direct_message'],(bot,message) => {

        const language = detectLanguage(message);

         EBXLicensesProvider.getLicense(message.expiration).then((license) => {
             bot.reply(message, formatLicense(license, messages('BOT_001', language), language));
         }).catch((err) => {
            bot.reply(message, messages('BOT_ERR', language));
        });

    });

    controller.hears(['license', 'licence'],['direct_message','direct_mention','mention'],(bot,message) => {

        const language = detectLanguage(message);
        const replyMessage = messages('BOT_001', language);

         EBXLicensesProvider.getLicense(message.expiration).then((license) => {
             bot.reply(message, formatLicense(license, `<@${message.user}>, ${replyMessage}`, language));
         }).catch((err) => {
            bot.reply(message, messages('BOT_ERR', language));
        });

    });

    controller.hears(['license', 'licence'],['ambient'],(bot,message) => {

        const language = detectLanguage(message);
        const replyMessage = messages('BOT_002', language);

         EBXLicensesProvider.getLicense(message.expiration).then((license) => {
             bot.reply(message, formatLicense(license, `<@${message.user}>, ${replyMessage}`, language));
         }).catch((err) => {
             console.error(err);
            bot.reply(message, messages('BOT_ERR', language));
        });

    });

    controller.on(['direct_message','direct_mention','mention'],(bot,message) => {

        const language = detectLanguage(message);
        bot.reply(message, messages('BOT_CONV', language));

    });

};
