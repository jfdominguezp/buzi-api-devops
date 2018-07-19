const mongoose        = require('mongoose');
const randtoken       = require('rand-token');
const { general }     = require('../errors/error-types');
const { createError } = require('../errors/error-generator');
const Schema          = mongoose.Schema;

const VerifyTokenSchema = new Schema({
    token: { type: String, required: true },
    userId: { type: String, required: true },
    provider: { type: String, required: true },
    isSocial: { type: Boolean, required: true },
    used: { type: Boolean, default: false }
},
{
    timestamps: true
});

VerifyTokenSchema.index({ createdAt: 1 }, { expires: '30d' });

VerifyTokenSchema.statics.generateToken = function (userId, provider, isSocial) {
    const VerifyToken = mongoose.model('VerifyToken', VerifyTokenSchema);
    if(!userId || !provider) throw createError(general.INCOMPLETE_REQUEST);

    const newToken = new VerifyToken({
        userId,
        provider,
        isSocial,
        token: randtoken.generate(16)
    });

    return newToken.save();
}

VerifyTokenSchema.statics.useToken = async function (token, userId, provider, isSocial) {
    const verifyToken = await this.findOne({ token, userId, provider, isSocial });
    if(!verifyToken) throw createError(general.NOT_FOUND, 'Verification token not found');
    if(verifyToken.used) throw createError(general.BAD_REQUEST, 'Token already used');
    verifyToken.used = true;
    return verifyToken.save();
}


module.exports = mongoose.model('VerifyToken', VerifyTokenSchema);
