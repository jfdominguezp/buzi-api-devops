const mongoose = require('mongoose');
const Benefit  = require('./benefit');
const Schema   = mongoose.Schema;

const SpendingReward = new Schema({
    rewardType: { type: String, required: true },
}, 
{
    timestamps: true
});

SpendingReward.statics.allFound = async function (ids, query) {
    const rewards = await this.find({ ...query, _id: { $in: ids }}, '_id businessId');
    return rewards.length == ids.length;
}

Benefit.discriminator('SpendingReward', SpendingReward);

module.exports = mongoose.model('SpendingReward');
