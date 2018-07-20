const mongoose = require('mongoose');
const Benefit  = require('./benefit');
const Schema   = mongoose.Schema;

const SpendingReward = new Schema({
    rewardType: { type: String, required: true },
    spendingGoal: { type: Number, required: true } 
}, 
{
    timestamps: true
});

Benefit.discriminator('SpendingReward', SpendingReward);

module.exports = mongoose.model('SpendingReward');
