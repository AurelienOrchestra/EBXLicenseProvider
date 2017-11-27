const MessagesFactory = require('messages-factory');
const messagesFra = new MessagesFactory(require('./fra.json'));
const messagesEng = new MessagesFactory(require('./eng.json'));

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
