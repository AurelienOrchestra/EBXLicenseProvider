// Dependencies
const htmlparser = require('htmlparser2');
const moment = require('moment');
const _ = require('lodash');
const ErrorsFactory = require('errors-factory');
const errors = new ErrorsFactory(require('./errors.json'));

// Get the logger
const logger = require('winston').loggers.get('Provider');

// Constants

const nbDaysLicenseExpiration = 60;
logger.log('debug', `Define the default expiration of the trial license to ${nbDaysLicenseExpiration}`);

// Define a local cache
logger.log('debug', 'Define an empty cache');
const cache = {
    date: null,
    data: null
};

/**
 * Class representing a License.
 *
 * @class
 * @since 1.0.0
 */
class License {

    /**
     * Create a new instance of License.
     *
     * @param {!String} key The license key.
     * @param {!Date} date The generation date of the license.
     */
    constructor(key, date) {

        if(!_.isString(key) || !date.isValid()) {
            throw errors.ERR_PROVIDER_003;
        }

        /**
         * @type {String}
         * @since 1.0.0
         */
        this.key = key;

        // ---------------------------------------------------------------------

        const generationDate = date.startOf('day');
        /**
         * @type {Date}
         * @since 1.0.0
         */
        this.generationDate = generationDate.toDate();

        // ---------------------------------------------------------------------

        /**
         * @type {Number}
         * @since 1.0.0
         */
        this.initialValidityDays = nbDaysLicenseExpiration;

        // ---------------------------------------------------------------------

        const expirationDate = moment(this.generationDate);
        expirationDate.add(nbDaysLicenseExpiration - 1, 'days');
        expirationDate.endOf('day');

        /**
         * @type {Date}
         * @since 1.0.0
         */
        this.expirationDate = expirationDate.toDate();

        // ---------------------------------------------------------------------

        const today = moment().startOf('day');

        if (today.isBetween(generationDate, expirationDate, 'day', '[]')) {

            /**
             * @type {Boolean}
             * @since 1.0.0
             */
            this.valid =  true;
        } else {
            this.valid =  false;
        }

        // ---------------------------------------------------------------------

        const nbValidDays = _.round(expirationDate.diff(today, 'days', true));
        if (nbValidDays < 0) {

            /**
             * @type {Number}
             * @since 1.0.0
             */
            this.nbValidDays = 0;
        } else {
            this.nbValidDays = nbValidDays;
        }
    }

}

/**
 * Export a function getting the url of the license page and returning the public
 * functions of the provider.
 *
 * @since 1.0.0
 * @param {!String} licensePageURL The url of the license page.
 */
module.exports = (licensePageURL) => {

    /**
     * Extract and parse the content of the license page.
     *
     * @since 1.0.0
     * @return {Promise} a Promise providing an Array of all valid Licenses.
     */
    const extract = () => {

        logger.info('Extracting licenses information from the license page');

        return new Promise((resolve, reject) => {

            const request = require('request-promise');

            logger.log('verbose', 'HTTP requesting the license page', { url : licensePageURL });
            // HTTP request of the page
            request(licensePageURL).then((content) => {

                logger.log('verbose', 'Getting the content of the license page');
                // Parse the content to get the licenses
                const licenses = parse(content);
                resolve(licenses);

            }).catch((err) => {
                logger.error('Error raised when HTTP requesting the license page', { url : licensePageURL });
                reject(err);
            });

        });
    }

    /**
     * Parse the content of the page to extract the license information and create
     * the corresponding License instance.
     *
     * @param {String} content The content of the license page.
     * @since 1.0.0
     * @return {Array} An array of valid License instances.
     */
    const parse = (content) => {

        logger.info('Parsing the content of the license page');

        let licenses = [];

        // The parser will use this function to handle the DOM
        const handler = new htmlparser.DomHandler((err, dom) => {
            if (err) {
                logger.error('Error raised while handling the DOM while parsing the content of the license page');
            }
            else  {

                // Filter the DOM to certain Element/item and iterate for each one
                // That part is very specific to the current version (November 2017) of the license page
                licenses = _.map(_.filter(dom, { 'type':'tag', 'name':'a'}), (item) => {

                    // Extract the key from the href of the link
                    let key = _.replace(item.attribs.href, 'view.cgi/EBX5 Trial 60 daysEnterprise Edition - ', '');
                    key = _.replace(key, '.txt', '');
                    key = _.trim(key);

                    // Extract the date
                    let date = moment(_.trim(item.prev.data), 'YYYY-MM-DD');

                    // Create a new License instance
                    logger.log('verbose', 'Creating a new license with following inputs', {
                        key: key,
                        date: date.toDate()
                    });

                    let license = null;
                    try {
                        license = new License(key, date);
                        logger.log('verbose', 'License created', license);
                        return license;
                    } catch (err) {
                        if (!err.message.includes('ERR_PROVIDER_003')) {
                            logger.error(errors.ERR_000);
                        }
                        logger.error(err);
                    }
                });
            }
        }, {
            normalizeWhitespace: true
        });

        // Parse
        const parser = new htmlparser.Parser(handler);
        parser.write(content);
        parser.end();

        // Filter to only valid licenses
        licenses = _.filter(licenses, 'valid');
        // Sort by generation date in reverse order (latest first, oldest last)
        licenses = _.sortBy(licenses, 'generationDate');
        licenses = _.reverse(licenses);

        logger.log('verbose', 'Returning the list of licenses');

        return licenses;
    }

    /**
     * Update the locale cache by running the extract.
     *
     * @since 1.0.0
     * @return {Promise} An empty Promise.
     */
    const update = () => {

        logger.info('Updating the cache');

        return new Promise((resolve, reject) => {

            extract().then((licenses) => {

                // Updating the cache
                cache.date = new Date();
                cache.data = licenses;

                logger.info('Cache updated');

                resolve();

            }).catch((err) => {

                logger.error('Something went wrong while extracting the data from the license page');
                reject(err);

            });

        });
    }

    // -------------------------------------------------------------------------

    /**
     * Provide all valid licenses.
     *
     * @since 1.0.0
     * @return {Promise} A promise providing an Array of all valid licenses.
     */
    const getLicenses = () => {

        logger.info('Getting the list of licenses');

        return new Promise((resolve, reject) => {

            // Check if the cache is updated, ie. same day as today
            if (moment().isSame(cache.date, 'day')) {
                // If yes, return the cache data in the Promise
                logger.log('verbose', 'Cache is up-to-date, directly using its data');
                logger.info('Providing the list of licenses');
                resolve(cache.data);
            } else {
                // If not, update the cache, then return the cache data in the Promise
                logger.info('Cache not up-to-date');
                update().then(() => {

                    logger.info('Providing the list of licenses');
                    resolve(cache.data);

                }).catch((err) => {

                    logger.error(`Can't provide the list of licenses`);
                    logger.error('Something went wrong while updating the cache');

                    const error = errors.ERR_PROVIDER_001;
                    logger.error(error);
                    reject(error);

                });
            }

        });

    }

    /**
     * Provide a valid license corresponding to the expiration parameter.
     *
     * @param {?Number|Date} expiration A number of days or a date of expiration.
     * @since 1.0.0
     * @return {Promise} A promise providing an instance of License.
     */
    const getLicense = (expiration) => {

        logger.info(`Getting the license with expiration ${expiration}`);

        return new Promise((resolve, reject) => {

            // Get all licenses via the getLicenses function (avoid dealing with cache update)
            getLicenses().then((licenses) => {

                logger.log('verbose', 'Retreiving the list of licenses');

                let license = null;

                if(_.isNil(expiration) || (_.isString(expiration) && _.isEmpty(expiration))) {

                    // If the expiration parameter is not defined, get the latest license, ie. max valid days
                    logger.log('verbose', 'As expiration is not defined, getting the latest license');
                    license = _.maxBy(licenses, 'nbValidDays');

                } else if (_.isDate(expiration)) {

                    // If expiration parameter is a Date get the corresponding license, null if not found
                    logger.log('verbose', 'As expiration is a date, getting the license by expiration date');
                    license = _.find(licenses, (item) => {
                        const expirationDate = item.expirationDate;
                        return moment(expiration, 'YYYY-MM-DD').isSame(expirationDate, 'day');

                    });

                } else if (_.isFinite(expiration)) {

                    logger.log('verbose', 'As expiration is a number, getting the license by remaining valid days');
                    // If expiration parameter is a finite number, get the corresponding license, ie. same valid days
                    license = _.find(licenses, {'nbValidDays': expiration});

                }


                if (_.isNil(license)) {

                    // If no license found, return an error
                    const licenseNotFoundError = errors.ERR_PROVIDER_002;
                    licenseNotFoundError.expiration = expiration;

                    logger.warn('License not found');
                    logger.warn(licenseNotFoundError);
                    reject(licenseNotFoundError);

                } else {

                    // If license found, return the license
                    logger.info('Providing the license', license);
                    resolve(license);
                }

            }).catch((err) => {

                logger.error(`Can't provide the license`);

                if (err && err.message.includes('ERR_PROVIDER_001')) {
                    logger.error('Something went wrong while getting the list of licenses');
                    reject(err);
                } else {
                    logger.error('Something unexpected went wrong');
                    reject(errors.ERR_000);
                }

            });
        });

    }

    /**
     * Provide the latest valid license.
     *
     * @since 1.0.0
     * @return {Promise} A promise providing an instance of License.
     */
    const getLatestLicense = () => {
        // Simply redirect to getLicense function with no parameter
        logger.info('Getting the latest license');
        return getLicense();
    }

    logger.log('verbose', 'Provider configured');

    // Export the public functions
    return {
        getLicenses,
        getLicense,
        getLatestLicense
    }

}
