const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const CustomerMembership = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    spending: {
        totalSpending: { type: Number, required: true },
        availableSpending: { type: Number, required: true },
        nextReward: { type: Schema.Types.ObjectId, required: true }
    }
}, 
{
    timestamps: true
});

module.exports = mongoose.model('CustomerMembership', CustomerMembership);