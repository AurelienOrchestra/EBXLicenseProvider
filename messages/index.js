// Dependencies
const MessagesFactory = require('messages-factory');

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

    let message;

    switch(language) {
        case 'eng':
            message = messagesEng[code](values);
            break;
        case 'fra':
            message = messagesFra[code](values);
            break;
        default:
            message = messagesEng[code](values);
    }

    return message;
};
