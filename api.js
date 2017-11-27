const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const _ = require('lodash');
const moment = require('moment');

module.exports = (EBXLicensesProvider, port) => {

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
    router.get('/', (req, res) => {
        res.json({message: 'Welcome to the EBX License provider REST API!'});
    });

    // Route /licenses return all valid licenses.
    router.route('/licenses').get((req, res) => {
        EBXLicensesProvider.getLicenses()
            .then(licenses => {
                res.json(licenses);
            })
            .catch(err => {
                res.send(err);
            });
    });

    // Route /licenses/latest return the latest valid license.
    router.route('/licenses/latest').get((req, res) => {
        EBXLicensesProvider.getLatestLicense()
            .then(license => {
                res.json(license);
            })
            .catch(err => {
                res.send(err);
            });
    });

    // Route /licenses/:expiration try to return the license correpsonding to the parameter.
    router.route('/licenses/:expiration').get((req, res) => {
        const expirationParam = req.params.expiration;

        let expiration;

        const expirationDate = moment(expirationParam, 'YYYY-MM-DD', true);
        const expirationInt = _.toInteger(expirationParam);

        if (expirationDate.isValid()) {
            expiration = expirationDate.toDate();
        } else if (_.isFinite(expirationInt)) {
            expiration = expirationInt;
        } else {
            expiration = expirationParam;
        }

        EBXLicensesProvider.getLicense(expiration)
            .then((license) => {
                res.json(license);
            })
            .catch((err) => {
                res.send(err);
            });
    });

    // Mount the router
    app.use('/api', router)

    // Start the server
    app.listen(port);
};
