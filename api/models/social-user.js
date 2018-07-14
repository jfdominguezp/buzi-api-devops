const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const SocialUserSchema = new Schema({
    connection: { type: String, enum: ['Facebook', 'Google'], required: true },
    oauthId: { type: String }
},
{
    timestamps: true
});

SocialUserSchema.index({ connection: 1, oauthId: 1 }, { unique: true });

module.exports = mongoose.model('SocialUser', SocialUserSchema);
