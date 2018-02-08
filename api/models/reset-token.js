var mongoose  = require('mongoose');
var randtoken = require('rand-token');
var Schema    = mongoose.Schema;

var ResetTokenSchema = new Schema({
    token: { type: String, required: true },
    userId: { type: String, required: true },
    used: { type: Boolean, default: false }
},
{
    timestamps: true
});

ResetTokenSchema.index({ createdAt: 1 }, { expires: '1h' });
ResetTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

ResetTokenSchema.statics.generateToken = function(userId, cb) {
    var ResetToken = mongoose.model('ResetToken', ResetTokenSchema);
    var newToken = new ResetToken();

    this.findOne({ userId: userId, used: false }, function(error, token) {
        if(error) return cb(error);
        if(token) return cb(null, token);

        newToken.token = randtoken.generate(24);
        newToken.userId = userId;

        newToken.save(cb);
    });
}

ResetTokenSchema.statics.useToken = function(userId, token, cb) {
    this.findOne({ userId: userId, token: token }, function(error, token) {
        if(error) return cb(error);
        if(!token) return cb('Invalid token');
        if(token.used) return cb('Token used');
        token.used = true;
        return token.save(cb);
    });
}

module.exports = mongoose.model('ResetToken', ResetTokenSchema);
