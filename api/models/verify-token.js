const mongoose  = require('mongoose');
const randtoken = require('rand-token');
const Schema    = mongoose.Schema;

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

VerifyTokenSchema.statics.generateToken = (userId, provider, isSocial, cb) => {
    const VerifyToken = mongoose.model('VerifyToken', VerifyTokenSchema);
    if(!userId || !provider) return cb('Bad Request');

    const newToken = new VerifyToken({
        userId,
        provider,
        isSocial,
        token: randtoken.generate(16)
    });

    return newToken.save(cb);
}

VerifyTokenSchema.statics.useToken = (token, userId, provider, isSocial, cb) => {
    this.findOne({ token, userId, provider, isSocial }, (error, token) => {
        if(error) return cb(error);
        if(!token) return cb('Invalid id or token');
        if(token.used) return cb('Token used');
        token.used = true;
        return token.save(cb);
    });
}


module.exports = mongoose.model('VerifyToken', VerifyTokenSchema);
