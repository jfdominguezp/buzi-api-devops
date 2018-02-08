var mongoose  = require('mongoose');
var randtoken = require('rand-token');
var Schema    = mongoose.Schema;

var VerifyTokenSchema = new Schema({
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

VerifyTokenSchema.statics.generateToken = function(userId, provider, isSocial, cb) {
    var VerifyToken = mongoose.model('VerifyToken', VerifyTokenSchema);
    var newToken = new VerifyToken();
    if(!userId || !provider) return cb('Bad Request');

    newToken.token = randtoken.generate(16);
    newToken.userId = userId;
    newToken.provider = provider;
    newToken.isSocial = isSocial;

    return newToken.save(cb);
}

VerifyTokenSchema.statics.useToken = function(token, userId, provider, isSocial, cb) {
    this.findOne({ token: token, userId: userId, provider: provider, isSocial: isSocial }, function(error, token) {
        if(error) return cb(error);
        if(!token) return cb('Invalid id or token');
        if(token.used) return cb('Token used');
        token.used = true;
        return token.save(cb);
    });
}


module.exports = mongoose.model('VerifyToken', VerifyTokenSchema);
