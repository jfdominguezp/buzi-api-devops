const mongoose = require('mongoose');
const Benefit  = require('./benefit');
const Schema   = mongoose.Schema;

const SpendingReward = Benefit.discriminator('SpendingReward', new Schema({
    rewardType: { type: String, required: true },
    acumSpending: { type: Number, required: true } 
}));

module.exports = SpendingReward;
