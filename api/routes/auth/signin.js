const randtoken       = require('rand-token');
const mongoose        = require('mongoose');
const LocalUser       = require('../../models/local-user');
const { createError } = require('../../errors/error-generator');
const ErrorTypes      = require('../../errors/error-types');
const tokens          = require('./tokens');

const { issueAccessToken, storeRefreshToken } = tokens;

const {
    INVALID_CREDENTIALS,
    GENERAL_AUTH_ERROR,
    INCORRECT_PASSWORD
} = ErrorTypes.auth;

async function signin(credentials, model, connection, returnFields) {
    const user = await authenticateCredentials(credentials, connection);
    if(!user) throw createError(INVALID_CREDENTIALS, 'User does not exist');

    const query = { 'identities.userId': user._id, 'identities.provider': 'Local', 'identities.isSocial': false };
    const userData = await mongoose.model(model).findOne(query);
    if (!userData) throw createError(GENERAL_AUTH_ERROR, 'General Auth Error');

    const resData = { };
    returnFields.forEach(field => { resData[field] = userData[field] });
    
    const tokenSet = { accessToken: issueAccessToken(user, false), refreshToken: randtoken.generate(16) };
    await storeRefreshToken(user._id, tokenSet.refreshToken, 'Local', false);
    return { userId: user._id, data: resData, tokens: tokenSet };
}

async function authenticateCredentials({ email, password, username }, connection) {
    let query = { connection };
    if (username) query = { username, ...query };
    if (email) query = { email, ...query }

    const user = await LocalUser.findOne(query);
    if (!user) throw createError(INVALID_CREDENTIALS, 'User does not exist');

    const isMatch = await user.passwordMatch(password);
    if (!isMatch) throw createError(INCORRECT_PASSWORD, 'Wrong password');

    return user;
}

module.exports = signin;