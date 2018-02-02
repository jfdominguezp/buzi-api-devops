var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var RefreshTokenSchema = new Schema({
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

RefreshTokenSchema.statics.getToken = function(token, userId, cb) {
    this.findOne({ token: token, userId: userId }, function(error, data) {
        if(error) return cb(error, false);
        if(!data || !data.token || !data.active) return cb(null, false);
        return cb(null, data);
    });
};

RefreshTokenSchema.statics.revokeToken = function(token, userId, cb) {
    this.findOneAndUpdate(
        { token: token, userId: userId },
        { $set: { active: false } },
        { new: true },
        function(error, data) {
            if(error) return cb(error);
            if(!data || !data.token) return cb('Token not found');
            return cb(null, data);
        }
    );
};

RefreshTokenSchema.statics.updateLastAccess = function(token, userId) {
    this.findOneAndUpdate(
        { token: token, userId: userId },
        { $set: { lastAccess: Date.now() } },
        function(error, token) {
            if(error) console.log('Error updating refresh token ' + token.token + ' with userId ' +  token.userId);
        }
    );
}

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
