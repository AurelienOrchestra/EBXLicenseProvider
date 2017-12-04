// Dependencies
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const _ = require('lodash');
const moment = require('moment');

// Get the logger
const logger = require('winston').loggers.get('REST');

module.exports = (EBXLicensesProvider, port) => {

    logger.log('verbose', 'Setting up server for REST API');

    // Basic configuration of the server
    app.use(bodyParser.json());
    app.use(bodyParser.json({
        type:'application/vnd.api+json'
    }));
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(methodOverride('X-HTTP-Method-Override'));
    app.disable('x-powered-by');

    // Define the routes of the REST API

    const router = express.Router();

    // Route /licenses return all valid licenses.
    router.route('/licenses').get((req, res) => {

        logger.log('info', 'Request from route /licenses');

        logger.log('verbose', 'Requesting provider for licenses with getLicenses()');

        EBXLicensesProvider.getLicenses()
            .then(licenses => {

                logger.log('verbose', 'Provider returned requested licenses');
                logger.log('debug', 'Licenses:', licenses);

                logger.log('verbose', 'Responding successfully to request from /licenses');
                res.json(licenses);

            })
            .catch(err => {

                // TODO handle the error
                logger.log('error', 'Provider returned an error on getLicenses()', err);

                logger.log('verbose', 'Responding with an error to request from /licenses');
                res.send(err);

            });
    });

    // Route /licenses/latest return the latest valid license.
    router.route('/licenses/latest').get((req, res) => {

        logger.log('info', 'Request from route /licenses/latest');

        logger.log('verbose', 'Requesting provider for the latest license with getLatestLicense()');

        EBXLicensesProvider.getLatestLicense()
            .then(license => {

                logger.log('verbose', 'Provider returned the requested latest license');
                logger.log('debug', 'Latest license:', license);

                logger.log('verbose', 'Responding successfully to request from /licenses/latest');
                res.json(license);

            })
            .catch(err => {

                // TODO handle the error
                logger.log('error', 'Provider returned an error on getLatestLicense()', err);

                logger.log('verbose', 'Responding with an error to request from /licenses/latest');
                res.send(err);

            });
    });

    // Route /licenses/:expiration try to return the license correpsonding to the parameter.
    router.route('/licenses/:expiration').get((req, res) => {

        logger.log('info', 'Request from route /licenses/:expiration');

        // Get the expiration from the parameters
        const expirationParam = req.params.expiration;

        logger.log('debug', `Expiration parameter extracted from the request is: ${expirationParam}`);

        let expiration;

        // Analyze the expiration as a Date or an Integer
        const expirationDate = moment(expirationParam, 'YYYY-MM-DD', true);
        const expirationInt = _.toInteger(expirationParam);

        // Check the expiration parameter is valid
        if (expirationDate.isValid()) {
            expiration = expirationDate.toDate();
            logger.log('debug', `Expiration parameter has been identified as a date: ${expiration}`);
        } else if (_.isFinite(expirationInt)) {
            expiration = expirationInt;
            logger.log('debug', `Expiration parameter has been identified as a number: ${expiration}`);
        } else {
            expiration = expirationParam;
            logger.log('debug', `Expiration parameter has not been identified as a number neither a date: ${expiration}`);
        }

        logger.log('verbose', 'Requesting provider for the latest license with getLicense(expiration)', { expiration });

        // Get the corresponding license
        EBXLicensesProvider.getLicense(expiration)
            .then((license) => {

                logger.log('verbose', `Provider returned the requested licenses with expiration ${expiration}`);
                logger.log('debug', `License with expiration ${expiration}`, license);

                logger.log('verbose', 'Responding successfully to request from /licenses/:expiration');
                res.json(license);

            })
            .catch((err) => {

                // TODO handle the error
                logger.log('error', 'Provider returned an error on getLicense(expiration)', { expiration, err });

                logger.log('verbose', 'Responding with an error to request from /licenses/:expiration');
                res.send(err);

            });
    });

    // Mount the router
    app.use('/api', router);
    logger.log('verbose', 'Routes for REST API set up');

    // Start the server
    app.listen(port);
    logger.info(`Server listening on port ${port}`);
};
