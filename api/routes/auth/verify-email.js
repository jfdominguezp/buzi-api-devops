const LocalUser        = require('../../models/local-user');
const VerifyToken     = require('../../models/verify-token');
const { createError } = require('../../errors/error-generator');
const ErrorTypes      = require('../../errors/error-types');

async function verifyAccount(userId, token, provider, isSocial) {
    await VerifyToken.useToken(token, userId, provider, isSocial);
    const user = await LocalUser.markEmailVerified(userId);
    if (!user) {
        throw createError(ErrorTypes.general.NOT_FOUND);
    }
    const { _id, email_verified } = user;
    return { _id, email_verified };
}

module.exports = { verifyAccount };