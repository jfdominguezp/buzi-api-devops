const mongoose        = require('mongoose');
const Schema          = mongoose.Schema;
const { createError } = require('../errors/error-generator');
const ErrorTypes      = require('../errors/error-types');

const RefreshTokenSchema = new Schema({
    token: { type: String, required: true },
    userId: { type: String, required: true },
    provider: { type: String, required: true },
    isSocial: { type: Boolean, required: true },
    lastAccess: { type: Date },
    active: { type: Boolean, default: true }
},
{
    timestamps: true
});

RefreshTokenSchema.index({ updatedAt: 1 }, { expires: '10d' });

RefreshTokenSchema.statics.getToken = async function (token, userId) {
    const refreshToken = await this.findOne({ token, userId });
    if(!refreshToken || !refreshToken.token || !refreshToken.active) {
        createError(ErrorTypes.general.NOT_FOUND, 'Invalid token or id');
    }
    return refreshToken;
};

RefreshTokenSchema.statics.revokeToken = async function (token, userId) {
    const refreshToken = await this.findOneAndUpdate(
        { token, userId },
        { $set: { active: false } },
        { new: true }
    );
    if(!refreshToken || !refreshToken.token) {
        createError(ErrorTypes.general.NOT_FOUND, 'Invalid token or id');
    }
    return refreshToken;
};

RefreshTokenSchema.statics.updateLastAccess = async function (token, userId) {
    const refreshToken = await this.findOneAndUpdate(
        { token, userId },
        { $set: { lastAccess: Date.now() } }
    );
    if(!refreshToken || !refreshToken.token) {
        createError(ErrorTypes.general.NOT_FOUND, 'Invalid token or id');
    }
    return refreshToken;
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
