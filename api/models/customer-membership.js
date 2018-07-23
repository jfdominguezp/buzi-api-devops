const mongoose               = require('mongoose');
const randomstring           = require('randomstring');
const Business               = require('./business');
const { createError }        = require('../errors/error-generator');
const { NO_REWARDS_PROGRAM } = require('../errors/error-types').rewards;
const Schema                 = mongoose.Schema;

const AwardedBenefit = new Schema ({
    benefitId: { type: Schema.Types.ObjectId, ref: 'SpendingReward', required: true },
    code: { type: String, required: true },
    updates: [{
        createdAt: { type: Date, default: Date.now() },
        status: { type: String, required: true, enum: ['Awarded', 'Claimed', 'Used'] }
    }]
});

const SpendingTransaction = new Schema({
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Credit', 'Debit'] },
    createdAt: { type: Date, default: Date.now() }
});

const CustomerMembershipSchema = new Schema({
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    business: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    spendingTransactions: [SpendingTransaction],
    awardedBenefits: [AwardedBenefit]
}, 
{
    timestamps: true
});

CustomerMembershipSchema.statics.addSpendingTransaction = async function(business, member, amount) {
    //Get membership
    let membership = await this.findOne({ member, business }).populate('business');
    let membershipBusiness;

    //Create membership if doesn't exist
    if (!membership) {
        const CustomerMembership = mongoose.model('CustomerMembership', CustomerMembershipSchema);
        membership = new CustomerMembership({ member, business });
        membershipBusiness = await Business.findById(business);
    } else {
        membershipBusiness = membership.business;
    }

    //Find next benefit
    const nextReward = membershipBusiness.findNextReward(membership.awardedBenefits);

    //If no rewards
    if (!nextReward) throw createError(NO_REWARDS_PROGRAM, 'No rewards created');

    //Register transaction and totalize (amount should be validated in the calling function)
    membership.addSpendingTransaction(amount);

    const { goalAmount, benefitId } = nextReward;

    if (membership.totalizeTransactions() >= goalAmount) {
        membership.addAwardingTransaction(goalAmount);
        membership.addAwardedBenefit(benefitId);
    }

    return membership.save();
}

CustomerMembershipSchema.methods.totalizeTransactions = function() {
    return this.spendingTransactions.reduce((accumulate, current) => {
        return accumulate + current.amount;
    }, 0);
}

CustomerMembershipSchema.methods.addSpendingTransaction = function(amount) {
    this.spendingTransactions.push({ amount, type: 'Credit' });
}

CustomerMembershipSchema.methods.addAwardingTransaction = function(amount) {
    this.spendingTransactions.push({ amount: (amount * -1), type: 'Debit' });
}

CustomerMembershipSchema.methods.addAwardedBenefit = function(benefitId) {
    const pastCodes = this.awardedBenefits.map(({code}) => code);
    this.awardedBenefits.push({
        benefitId,
        code: generateRewardCode(pastCodes),
        updates: [{ status: 'Awarded' }]
    });
}

//Helper functions
function generateRewardCode(codes) {
    const options = { charset: 'alphanumeric', capitalization: 'uppercase', length: 6 };
    let code = randomstring.generate(options);
    
    while(codes.includes(code)) {
        code = randomstring.generate(options);
    }

    return code;
}

module.exports = mongoose.model('CustomerMembership', CustomerMembershipSchema);