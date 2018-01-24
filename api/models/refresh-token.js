var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var RefreshTokenSchema = new Schema({
    token: { type: String, required: true },
    user_id: { type: String, required: true },
    provider: { type: String, required: true },
    isSocial: { type: Boolean, required: true },
    active: { type: Boolean, default: true }
},
{
    timestamps: true
});

RefreshTokenSchema.statics.getToken = function(token, userId, cb) {
    this.findOne({ token: token, user_id: userId }, function(error, data) {
        if(error) return cb(error, false);
        if(!data || !data.token || !data.active) return cb(null, false);
        return cb(null, data);
    });
};

RefreshTokenSchema.statics.revokeToken = function(token, userId, cb) {
    this.findOneAndUpdate(
        { token: token, user_id: userId },
        { $set: { active: false } },
        { new: true },
        function(error, data) {
            if(error) return cb(error);
            if(!data || !data.token) return cb('Token not found');
            return cb(null, data);
        }
    );
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
