const jwt             = require('jsonwebtoken');
const RefreshToken    = require('../../models/refresh-token');
const LocalUser       = require('../../models/local-user');
const { authConfig }  = require('../../../config/server-config');
const { createError } = require('../../errors/error-generator');
const ErrorTypes      = require('../../errors/error-types');

const { NOT_FOUND } = ErrorTypes.general;
const { BAD_REFRESH_TOKEN } = ErrorTypes.auth;

async function refreshAccessToken(refreshToken, userId) {
    const token = await RefreshToken.getToken(refreshToken);
    if (!token) {
        throw createError(BAD_REFRESH_TOKEN, 'Bad refresh token');
    }
    if (token.userId !== userId) {
        throw createError(NOT_FOUND, 'Refresh token does not belong to the specified user');
    }
    if (!token.isSocial) {
        const user = await LocalUser.findOne({ _id: userId });
        if(!user) {
            throw createError(NOT_FOUND, 'User not found');
        }
        RefreshToken.updateLastAccess(refreshToken, userId);
        return { accessToken: issueAccessToken(user, false) };
    }
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

module.exports = { refreshAccessToken, issueAccessToken, storeRefreshToken };