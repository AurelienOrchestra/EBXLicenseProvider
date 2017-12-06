// Dependencies
const path = require('path');
const _ = require('lodash');
const ErrorsFactory = require('errors-factory');
const errors = new ErrorsFactory(require('./errors.json'));
const yargs = require('yargs');

// Define command line options
yargs.option('url', {
    alias: 'u',
    describe: 'Provide the url of the license page to parse',
    demandOption : true,
    type: 'string'
});
yargs.option('token', {
    alias: 't',
    describe: 'Provide the Slack bot token',
    demandOption : true,
    type: 'string'
});
yargs.option('port', {
    alias: 'p',
    describe: 'Provide the port the server will listen to',
    type: 'number',
    default: 3000
});
yargs.option('logDir', {
    describe: 'Provide the path of the log directory',
    type: 'string',
    default: './log'
});
yargs.option('verbose', {
    alias: 'v',
    describe: 'Enable verbose logs',
    type: 'boolean',
    default: false
});
yargs.option('debug', {
    describe: 'Enable debug logs',
    type: 'boolean',
    default: false
});

const args = yargs.argv;

// Getting the log options from command line
const logDir = args.logDir;
const verbose = args.verbose;
const debug = args.debug;

// Set up loggers
require('./logger')(logDir, debug, verbose);
// Get the logger
const logger = require('winston').loggers.get('App');

// Get the mandatory license page url argument from command line
const licensePageURL = process.env.LICENSE_PAGE_URL || args.url;
if (licensePageURL == null) {
    const err = errors.ERR_APP_001;
    logger.error(err);
    throw err;
}
logger.log('debug', `License page URL: ${licensePageURL}`);

// Get the mandatory slackbot token argument from command line
const slackBotToken = process.env.SLACKBOT_TOKEN || args.token;
if (slackBotToken == null) {
    const err = errors.ERR_APP_002;
    logger.error(err);
    throw err;
}
logger.log('debug', `Slackbot token: ${slackBotToken}`);

// Get the port argument from command line
const port = process.env.PORT || args.port;
logger.log('debug', `port: ${port}`);

// Initialize the EBX license provider
logger.info('Launch the EBX license provider');
const EBXLicensesProvider = require('./provider')(licensePageURL);

// Define the REST API
logger.info('Launch the REST API');
require('./api')(EBXLicensesProvider, port);

// Define the slackbot
logger.info('Launch the slackbot');
require('./bot')(EBXLicensesProvider, slackBotToken);
