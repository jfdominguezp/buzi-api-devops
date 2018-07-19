const mongoose = require('mongoose');
const Benefit  = require('./benefit');
const Schema   = mongoose.Schema;

const SpendingReward = Benefit.discriminator('SpendingReward', new Schema({
    rewardType: { type: String, required: true },
    spendingGoal: { type: Number, required: true } 
}, 
{
    timestamps: true
}));

module.exports = mongoose.model('SpendingReward');
