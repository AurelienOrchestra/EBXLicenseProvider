const _ = require('lodash');
const winston = require('winston');

module.exports = (debug, verbose) => {

    const level = debug ? 'debug' : (verbose ? 'verbose' : 'info');

    // -------------------------------------------------------------------------

    const appLabel = 'App';
    const appFilename = 'app';

    winston.loggers.add(appLabel, {
        transports: [
            new (winston.transports.Console)({
                label: appLabel,
                level: level,
                colorize: true,
                timestamp: true,
                prettyPrint: true,
                depth: 0
            }),
            new (winston.transports.File)({
                label: appLabel,
                name: appLabel,
                filename: `./log/${appFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

    const providerLabel = 'Provider';
    const providerFilename = 'provider';

    winston.loggers.add(providerLabel, {

        transports: [
            new (winston.transports.Console)({
                level: level,
                colorize: true,
                label: providerLabel,
                timestamp: true,
                prettyPrint: true,
                depth: 0
            }),
            new (winston.transports.File)({
                label: providerLabel,
                name: appLabel,
                filename: `./log/${appFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            }),
            new (winston.transports.File)({
                label: providerLabel,
                name: providerLabel,
                filename: `./log/${providerFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

    const restLabel = 'REST';
    const restFilename = 'rest';

    winston.loggers.add(restLabel, {

        transports: [
            new (winston.transports.Console)({
                level: level,
                colorize: true,
                label: restLabel,
                timestamp: true,
                prettyPrint: true,
                depth: 0
            }),
            new (winston.transports.File)({
                label: restLabel,
                name: appLabel,
                filename: `./log/${appFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            }),
            new (winston.transports.File)({
                label: restLabel,
                name: restLabel,
                filename: `./log/${restFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

    const botLabel = 'BOT';
    const botFilename = 'bot';

    winston.loggers.add(botLabel, {

        transports: [
            new (winston.transports.Console)({
                level: level,
                colorize: true,
                label: botLabel,
                timestamp: true,
                prettyPrint: true,
                depth: 0
            }),
            new (winston.transports.File)({
                label: botLabel,
                name: appLabel,
                filename: `./log/${appFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            }),
            new (winston.transports.File)({
                label: botLabel,
                name: botLabel,
                filename: `./log/${botFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

    const nlpLabel = 'NLP';
    const nlpFilename = 'nlp';

    winston.loggers.add(nlpLabel, {

        transports: [
            new (winston.transports.Console)({
                level: level,
                colorize: true,
                label: nlpLabel,
                timestamp: true,
                prettyPrint: true,
                depth: 0
            }),
            new (winston.transports.File)({
                label: nlpLabel,
                name: appLabel,
                filename: `./log/${appFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            }),
            new (winston.transports.File)({
                label: nlpLabel,
                name: nlpLabel,
                filename: `./log/${nlpFilename}.log`,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

};
