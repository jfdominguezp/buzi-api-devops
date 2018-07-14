const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

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

RefreshTokenSchema.statics.getToken = (token, userId, cb) => {
    this.findOne({ token, userId }, (error, data) => {
        if(error) return cb(error, null);
        if(!data || !data.token || !data.active) return cb(null, null);
        return cb(null, data);
    });
};

RefreshTokenSchema.statics.revokeToken = (token, userId, cb) => {
    this.findOneAndUpdate(
        { token, userId },
        { $set: { active: false } },
        { new: true },
        (error, data) => {
            if(error) return cb(error);
            if(!data || !data.token) return cb('Token not found');
            return cb(null, data);
        }
    );
};

RefreshTokenSchema.statics.updateLastAccess = (token, userId) => {
    this.findOneAndUpdate(
        { token, userId },
        { $set: { lastAccess: Date.now() } },
        (error, token) => {
            if(error) console.log('Error updating refresh token ' + token.token + ' with userId ' +  token.userId);
        }
    );
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
