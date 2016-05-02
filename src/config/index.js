module.exports = {
    mongoose: {
        url: "mongodb://localhost/njs-rest-api"
    },

    /**
     * Json Web Token configuration
     * @see https://www.npmjs.com/package/jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
     */
    jwt: {
        secret: '1Gb1iF05p1mLqQtuz1Pqmfz7',
        options: {
            expiresIn: 3600 * 24 * 14
        }
    }
};