const config = {
    mongoURI: {
        development: process.env.MONGODB_DEV_CONNECTION_STRING,
        test: process.env.MONGODB_TEST_CONNECTION_STRING,
        production: process.env.MONGODB_PROD_CONNECTION_STRING
    },
    authConfig: {
        jwtSecret: process.env.JWT_SECRET,
        refreshSecret: process.env.REFRESH_SECRET,
        issuer: process.env.JWT_ISSUER
    },
    URIs: {
        baseUri: process.env.BASE_URI,
        businessUri: process.env.BUSINESS_URI,
        passwordResetPath: process.env.PASSWORD_RESET_PATH
    }
};

module.exports = config;