const htmlparser = require('htmlparser2');
const moment = require('moment');
const _ = require('lodash');

const nbDaysLicenseExpiration = 60;

const cache = {
    date: null,
    data: null
};

class License {

    constructor(key, date) {

        this.key = key;

        const generationDate = date.startOf('day');
        this.generationDate = generationDate.toDate();

        this.initialValidityDays = nbDaysLicenseExpiration;

        const expirationDate = moment(this.generationDate);
        expirationDate.add(nbDaysLicenseExpiration - 1, 'days');
        expirationDate.endOf('day');
        this.expirationDate = expirationDate.toDate();

        const today = moment().startOf('day');

        if (today.isBetween(generationDate, expirationDate, 'day', '[]')) {
            this.valid =  true;
        } else {
            this.valid =  false;
        }

        const nbValidDays = _.round(expirationDate.diff(today, 'days', true));
        if (nbValidDays < 0) {
            this.nbValidDays = 0;
        } else {
            this.nbValidDays = nbValidDays;
        }
    }

}

module.exports = (licensePageURL) => {

    const extract = () => {

        return new Promise((resolve, reject) => {

            const request = require('request-promise');

            request(licensePageURL).then(content => {
                const licenses = parse(content);
                resolve(licenses);
            }).catch(err => {
                console.error(err);
                reject(err);
            });

        });
    }

    const parse = (content) => {

        let licenses = [];

        const handler = new htmlparser.DomHandler((err, dom) => { // TODO Handle errors
            if (err) {
                console.error(err);
            }
            else  {
                licenses = _.map(_.filter(dom, { 'type':'tag', 'name':'a'}), (item) => {

                    let key = _.replace(item.attribs.href, 'view.cgi/EBX5 Trial 60 daysEnterprise Edition - ', '');
                    key = _.replace(key, '.txt', '');
                    key = _.trim(key);

                    let date = moment(_.trim(item.prev.data), 'YYYY-MM-DD');

                    return new License(key, date);;
                });
            }
        }, {
            normalizeWhitespace: true
        });

        const parser = new htmlparser.Parser(handler);
        parser.write(content);
        parser.end();

        licenses = _.filter(licenses, 'valid');
        licenses = _.sortBy(licenses, 'generationDate');
        licenses = _.reverse(licenses);

        return licenses;
    }

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

    const getLicenses = () => {

        return new Promise((resolve, reject) => {

            if (!moment().isSame(cache.date, 'day')) {

                update().then(() => {
                    resolve(cache.data);
                }).catch((err) => {
                    reject(err);
                });

            } else {
                resolve(cache.data);
            }

        });

    }

    const getLicense = (expiration) => {

        return new Promise((resolve, reject) => {

            getLicenses().then((licenses) => {
                let license = null;

                if(_.isNil(expiration) || (_.isString(expiration) && _.isEmpty(expiration))) {
                    license = _.maxBy(licenses, 'nbValidDays');
                } else if (_.isDate(expiration)) {

                    license = _.find(licenses, (item) => {
                        const expirationDate = item.expirationDate;
                        return moment(expiration, 'YYYY-MM-DD').isSame(expirationDate, 'day');
                    });

                } else if (_.isFinite(expiration)) {
                    license = _.find(licenses, {'nbValidDays': expiration});
                }

                if (_.isNil(license)) {

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
                    resolve(license);
                }

            }).catch((err) => {
                reject(err);
            });
        });

    }

    const getLatestLicense = () => {
        return getLicense();
    }

    return {
        getLicenses,
        getLicense,
        getLatestLicense
    }

}
