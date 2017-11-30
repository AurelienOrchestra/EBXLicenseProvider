// Dependencies
const _ = require('lodash');
const args = require('yargs').argv;

// Getting debug and verbose argument from command line
const debug = args.debug;
const verbose = args.verbose;

// Set up loggers
require('./logger')(debug, verbose);
// Get the logger
const logger = require('winston').loggers.get('App');

// Get the mandatory license page url argument from command line
const licensePageURL = args.url || process.env.LICENSE_PAGE_URL;
if (licensePageURL == null) {
    const err = new Error('The url of the license page is mandatory!');
    logger.error(err);
    throw err;
}
logger.log('debug', `License page URL: ${licensePageURL}`);

// Get the mandatory slackbot token argument from command line
const slackBotToken = args.token || process.env.SLACKBOT_TOKEN;
if (slackBotToken == null) {
    const err = new Error('The token of the slackbot is mandatory!');
    logger.error(err);
    throw err;
}
logger.log('debug', `Slackbot token: ${slackBotToken}`);

// Get the port argument from command line
const port = args.port || process.env.PORT || 3000;
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
