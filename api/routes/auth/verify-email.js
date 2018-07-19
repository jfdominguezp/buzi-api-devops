const LocalUser       = require('../../models/local-user');
const VerifyToken     = require('../../models/verify-token');
const { createError } = require('../../errors/error-generator');
const ErrorTypes      = require('../../errors/error-types');
const mailing         = require('../../middleware/mailing');

async function verifyAccount(userId, token, provider, isSocial) {
    await VerifyToken.useToken(token, userId, provider, isSocial);
    const user = await LocalUser.markEmailVerified(userId);
    if (!user) {
        throw createError(ErrorTypes.general.NOT_FOUND);
    }
    const { _id, email_verified } = user;
    return { _id, email_verified };
}

async function startEmailVerification(userId, provider, isSocial, name, email) {
    const token = await VerifyToken.generateToken(userId, provider, isSocial);
    if(token) {
        const query = `userId=${userId}&token=${token.token}&provider=${provider}&isSocial=${isSocial}`;
        mailing.sendVerificationEmail(name, email, query);
    }
}

module.exports = { verifyAccount, startEmailVerification };