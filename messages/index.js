// Dependencies
const MessagesFactory = require('messages-factory');

// Get the loggers
const logger = require('winston').loggers.get('BOT');

// Get the messages
const messagesFra = new MessagesFactory(require('./fra.json'));
const messagesEng = new MessagesFactory(require('./eng.json'));

/**
 * Export the message factory function.
 *
 * @param {!String} code The code of the message.
 * @param {String} [language = 'eng'] The language of the message.
 * @param {String} values Additional values to integrate in the message.
 * @return {String} The localized message.
 */
module.exports = (code, language = 'eng', ...values) => {

    logger.log('verbose', `Message factory getting message with code ${code} and language ${language}`);

    let message;

    switch(language) {
        case 'eng':
            logger.log('debug', 'Using english messages');
            message = messagesEng[code](values);
            break;
        case 'fra':
            logger.log('debug', 'Using french messages');
            message = messagesFra[code](values);
            break;
        default:
            logger.log('debug', 'Using default english messages');
            message = messagesEng[code](values);
    }

    logger.log('debug', 'Message factory returning message', { message });

    return message;
};
