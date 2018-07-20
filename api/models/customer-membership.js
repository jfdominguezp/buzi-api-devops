const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const AwardedBenefit = new Schema ({
    benefitId: { type: Schema.Types.ObjectId, ref: 'Benefit', required: true },
    code: { type: String, required: true },
    updates: [{
        createdAt: { type: Date, default: Date.now() },
        status: { type: String, required: true }
    }]
});

const SpendingTransaction = new Schema({
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Add', 'Claim'] },
    benefitId: Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now() }
});

const CustomerMembership = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    spendingTransactions: [SpendingTransaction],
    awardedBenefits: [AwardedBenefit]
}, 
{
    timestamps: true
});

module.exports = mongoose.model('CustomerMembership', CustomerMembership);