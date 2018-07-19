const mongoose          = require('mongoose');
const randtoken         = require('rand-token');
const { auth, general } = require('../errors/error-types');
const { createError }   = require('../errors/error-generator');
const Schema            = mongoose.Schema;

const ResetTokenSchema = new Schema({
    token: { type: String, required: true },
    userId: { type: String, required: true },
    used: { type: Boolean, default: false }
},
{
    timestamps: true
});

ResetTokenSchema.index({ createdAt: 1 }, { expires: '1h' });
ResetTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

ResetTokenSchema.statics.generateToken = async function (userId) {
    const token = await this.findOne({ userId, used: false });
    if(token) return token;
    const ResetToken = mongoose.model('ResetToken', ResetTokenSchema);
    const newToken = new ResetToken({
        userId,
        token: randtoken.generate(24)
    });
    return newToken.save();
}

ResetTokenSchema.statics.useToken = async function (userId, token) {
    const resetToken = await this.findOne({ userId, token });
    if(!resetToken) throw createError(general.NOT_FOUND, 'Invalid id or token');
    if(resetToken.used) throw createError(auth.RESET_TOKEN_USED, 'Reset token already used');
    resetToken.used = true;
    return resetToken.save();
}

module.exports = mongoose.model('ResetToken', ResetTokenSchema);
