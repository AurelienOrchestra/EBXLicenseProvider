// Dependencies
const htmlparser = require('htmlparser2');
const moment = require('moment');
const _ = require('lodash');

// Constants
const nbDaysLicenseExpiration = 60;

// Define a local cache
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

        // TODO check parameters.

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

        return new Promise((resolve, reject) => {

            const request = require('request-promise');

            // HTTP request of the page
            request(licensePageURL).then(content => {

                // Parse the content to get the licenses
                const licenses = parse(content);
                resolve(licenses);

            }).catch(err => {
                console.error(err);
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

        let licenses = [];

        // The parser will use this function to handle the DOM
        const handler = new htmlparser.DomHandler((err, dom) => { // TODO Handle errors
            if (err) {
                console.error(err);
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
                    return new License(key, date);;
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

        return licenses;
    }

    /**
     * Update the locale cache by running the extract.
     *
     * @since 1.0.0
     * @return {Promise} An empty Promise.
     */
    const update = () => {

        return new Promise((resolve, reject) => {

            extract().then((licenses) => {

                // Updating the cache
                cache.date = new Date();
                cache.data = licenses;

                resolve();

            }).catch((err) => {
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

        return new Promise((resolve, reject) => {

            // Check if the cache is updated, ie. same day as today
            if (moment().isSame(cache.date, 'day')) {
                // If yes, return the cache data in the Promise
                resolve(cache.data);
            } else {
                // If not, update the cache, then return the cache data in the Promise
                update().then(() => {
                    resolve(cache.data);
                }).catch((err) => {
                    reject(err);
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

        return new Promise((resolve, reject) => {

            // Get all licenses via the getLicenses function (avoid dealing with cache update)
            getLicenses().then((licenses) => {
                let license = null;

                if(_.isNil(expiration) || (_.isString(expiration) && _.isEmpty(expiration))) {
                    // If the expiration parameter is not defined, get the latest license, ie. max valid days
                    license = _.maxBy(licenses, 'nbValidDays');
                } else if (_.isDate(expiration)) {

                    // If expiration parameter is a Date get the corresponding license, null if not found
                    license = _.find(licenses, (item) => {
                        const expirationDate = item.expirationDate;
                        return moment(expiration, 'YYYY-MM-DD').isSame(expirationDate, 'day');
                    });

                } else if (_.isFinite(expiration)) {

                    // If expiration parameter is a finite number, get the corresponding license, ie. same valid days
                    license = _.find(licenses, {'nbValidDays': expiration});
                }


                if (_.isNil(license)) {

                    // If no license found, return an error

                    let licenseNotFoundError = new Error(`License not found with the expiration ${expiration}.`);

                    if(_.isNil(expiration) || (_.isString(expiration) && _.isEmpty(expiration))) {
                        licenseNotFoundError = new Error(`Latest license not found.`);
                    } else if (_.isDate(expiration)) {
                        licenseNotFoundError = new Error(`License expiring on ${expiration} not found.`);
                    } else if (_.isFinite(expiration)) {
                        licenseNotFoundError = new Error(`License expiring in ${expiration} days not found.`);
                    }

                    reject(licenseNotFoundError);

                } else {

                    // If license found, return the license
                    resolve(license);
                }

            }).catch((err) => {
                reject(err);
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
        return getLicense();
    }

    // Export the public functions
    return {
        getLicenses,
        getLicense,
        getLatestLicense
    }

}
