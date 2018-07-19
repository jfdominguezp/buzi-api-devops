const emailValidate              = require('email-validator');
const LocalUser                  = require('../../models/local-user');
const ResetToken                 = require('../../models/reset-token');
const mailing                    = require('../../middleware/mailing');
const { createError }            = require('../../errors/error-generator');
const { BAD_REQUEST, NOT_FOUND } = require('../../errors/error-types').general;

async function startReset(email, connection) {
    if(!email || !emailValidate.validate(email)) {
        throw createError(BAD_REQUEST, 'Invalid email');
    }
    const user = await LocalUser.findOne({ email, connection });
    if(!user) {
        throw createError(NOT_FOUND, 'User not found');
    }
    const token = await ResetToken.generateToken(user._id);
    const query = `_id=${user._id}&token=${token.token}`;
    mailing.sendPasswordReset(email, query, connection);
    return 'Change requested';
}

async function endReset({ token, _id, password }, connection) {
    if(!token || !_id || !password) {
        throw createError(BAD_REQUEST, 'Bad reset password request');
    }
    await ResetToken.useToken(_id, token);
    await LocalUser.changePassword(_id, connection, password);
    return 'Password Changed';
}

module.exports = { startReset, endReset };