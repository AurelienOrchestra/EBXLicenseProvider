const path = require('path');
const _ = require('lodash');
const winston = require('winston');

module.exports = (logDir = './log', debug, verbose) => {

    const level = debug ? 'debug' : (verbose ? 'verbose' : 'info');

    // -------------------------------------------------------------------------

    const appLabel = 'App';
    const appFilename = path.join(logDir, `app.log`);

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
                filename: appFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

    const providerLabel = 'Provider';
    const providerFilename = path.join(logDir, `provider.log`);

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
                filename: appFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            }),
            new (winston.transports.File)({
                label: providerLabel,
                name: providerLabel,
                filename: providerFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

    const restLabel = 'REST';
    const restFilename = path.join(logDir, `rest.log`);

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
                filename: appFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            }),
            new (winston.transports.File)({
                label: restLabel,
                name: restLabel,
                filename: restFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

    const botLabel = 'BOT';
    const botFilename = path.join(logDir, `bot.log`);

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
                filename: appFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            }),
            new (winston.transports.File)({
                label: botLabel,
                name: botLabel,
                filename: botFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            })
        ]
    });

    // -------------------------------------------------------------------------

    const nlpLabel = 'NLP';
    const nlpFilename = path.join(logDir, `nlp.json`);

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
                filename: appFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: false
            }),
            new (winston.transports.File)({
                label: nlpLabel,
                name: nlpLabel,
                filename: nlpFilename,
                level: level,
                prettyPrint: true,
                depth: 0,
                json: true
            })
        ]
    });

    // -------------------------------------------------------------------------

};
