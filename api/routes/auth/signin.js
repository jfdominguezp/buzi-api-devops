const jwt             = require('jsonwebtoken');
const randtoken       = require('rand-token');
const LocalUser       = require('../../models/local-user');
const RefreshToken    = require('../../models/refresh-token');
const { createError } = require('../../errors/error-generator');
const ErrorTypes      = require('../../errors/error-types');
const { authConfig }  = require('../../../config/server-config');

async function signin(returnFields, connection, schema, credentials) {
    const user = await authenticateCredentials(credentials, connection);
    if(!user) throw createError(ErrorTypes.auth.INVALID_CREDENTIALS, 'User does not exist');

    const query = { 'identities.userId': user._id, 'identities.provider': 'Local', 'identities.isSocial': false };
    const userData = await schema.findOne(query);
    if (!userData) throw createError(ErrorTypes.auth.GENERAL_AUTH_ERROR, 'General Auth Error');

    const resData = { };
    returnFields.forEach(field => { resData[field] = userData[field] });
    
    const tokenSet = { accessToken: issueAccessToken(user, false), refreshToken: randtoken.generate(16) };
    await storeRefreshToken(user._id, tokenSet.refreshToken, 'Local', false);
    return { userId: user._id, data: resData, tokens: tokenSet };
}

async function authenticateCredentials({ email, password, username }, connection) {
    const query = { email, username, connection };

    const user = await LocalUser.findOne(query);
    if (!user) throw createError(ErrorTypes.auth.INVALID_CREDENTIALS, 'User does not exist');

    const isMatch = await user.passwordMatch(password);
    if (!isMatch) throw createError(ErrorTypes.auth.INVALID_CREDENTIALS, 'Wrong password');

    return user;
}

function issueAccessToken({ _id, email, connection, username }, isSocial) {
    const payload = {
        _id,
        email,
        username,
        connection,
        isSocial
    };
    const options = {
        expiresIn: 900,
        issuer: authConfig.issuer
    };
    const token = jwt.sign(payload, authConfig.jwtSecret, options);
    return token;
}

async function storeRefreshToken(userId, token, provider, isSocial) {
    const refresh = new RefreshToken({
        token,
        userId,
        provider,
        isSocial
    });
    return refresh.save();
}

module.exports = signin;