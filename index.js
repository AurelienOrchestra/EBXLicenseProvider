const _ = require('lodash');
const args = require('yargs').argv;

// Get the mandatory license page url argument from command line
const licensePageURL = args.url || process.env.LICENSE_PAGE_URL;
if (licensePageURL == null) {
    throw new Error('The url of the license page is mandatory!');
}

// Get the mandatory slackbot token argument from command line
const slackBotToken = args.token || process.env.SLACKBOT_TOKEN;
if (slackBotToken == null) {
    throw new Error('The token of the slackbot is mandatory!');
}

// Get the port argument from command line
const port = args.port || process.env.PORT || 3000;

// Initialize the EBX license provider
const EBXLicensesProvider = require('./provider')(licensePageURL);

// Define the REST API
require('./api')(EBXLicensesProvider, port);

// Define the slackbot
require('./bot')(EBXLicensesProvider, slackBotToken);
