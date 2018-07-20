const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const CustomerMembership = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    spendingTransactions: [{
        amount: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now() }
    }],
    awardedBenefits: [{
        benefitId: { type: Schema.Types.ObjectId, ref: 'Benefit', required: true },
        code: { type: String, required: true },
        updates: [{
            createdAt: { type: Date, default: Date.now() },
            status: { type: String, required: true }
        }]
    }]
}, 
{
    timestamps: true
});

module.exports = mongoose.model('CustomerMembership', CustomerMembership);