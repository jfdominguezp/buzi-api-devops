const mongoose            = require('mongoose');
const validator           = require('email-validator');
const dotNotate           = require('../util/dot-notate');
const Schema              = mongoose.Schema;

const BranchSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    location: { 
        type: { type: String, required: true }, 
        coordinates: { type: [Number], required: true }
    },
    country: { type: String, required: true },
    city: { type: String, required: true },
    email: {
        type: String,
        trim: true,
        validate: {
            validator: v => validator.validate(v),
            message: '{VALUE} is not a valid email!'
        },
    },
},
{
    timestamps: true
});

const ActiveSpendingRewardSchema = new Schema({
    benefitId: { 
        type: Schema.Types.ObjectId, 
        ref: 'SpendingReward', 
        required: true
    },
    goalAmount: { type: Number, required: true }
}, 
{
    _id: false
});

const BusinessSchema = new Schema({
    name: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    category: { type: String, required: true },
    logo: String,
    displayImage: String,
    contactData: {
        name: { type: String, required: true },
        email: {
            type: String,
            trim: true,
            required: true,
            validate: {
                validator: v => validator.validate(v),
                message: '{VALUE} is not a valid email!'
            },
        },
        phoneNumber: { type: String, required: true },
    },
    internetData: {
        website: String,
        facebookUser: String,
        instagramUser: String
    },
    identities: [{
        userId: { type: String, required: true },
        provider: { type: String, required: true, enum: ['Local', 'Facebook', 'Google'] },
        isSocial: { type: Boolean, required: true }
    }],
    branches: [BranchSchema],
    activeSpendingRewards: [ActiveSpendingRewardSchema]
},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

BusinessSchema.pre('save', function(next) {
    if (this.isNew) {
        this.branches = [];
        this.activeSpendingRewards = [];
    }
    next();
});

//Branches
BusinessSchema.statics.addBranch = function(_id, branch) {
    return this.findOneAndUpdate(
        { _id }, 
        { $push: { branches: branch } },
        { new: true, runValidators: true, fields: '-identities -activeSpendingRewards' }
    );
}

BusinessSchema.statics.updateBranch = function(_id, branchId,  fields) {
    
    const setFields = dotNotate(fields, { }, 'branches.$.');
    return this.findOneAndUpdate(
        { _id, 'branches._id': branchId }, 
        { $set: setFields },
        { new: true, runValidators: true, fields: '-identities -activeSpendingRewards' }
    );
}

BusinessSchema.statics.removeBranch = function(_id, branchId) {
    return this.findOneAndUpdate(
        { _id },
        { $pull: { branches: { _id: branchId } } },
        { new: true, runValidators: true, fields: '-identities -activeSpendingRewards' }
    );
}

//Spending Rewards
/**
 * Returns the next non-awarded reward. If all awarded, returns the least rewarded.
 * @param {*} _id 
 * @param {*} previousRewards 
 */
BusinessSchema.methods.findNextReward = function(previousRewards) {
    const { activeSpendingRewards } = this;

    if (!activeSpendingRewards.length) return null;

    //Get arrays of ids for available and past rewards
    const activeRewardsIds = activeSpendingRewards.map(({ benefitId }) => benefitId);
    const awardedRewards = previousRewards.map(({ benefitId }) => benefitId);

    //Find active rewards that haven't been awarded to the member
    const nonAwarded = activeRewardsIds.filter(id => !awardedRewards.includes(id));

    //If non-awarded rewards, return the first of the array
    if (nonAwarded.length) {
        return activeSpendingRewards.find(({ benefitId }) => benefitId === nonAwarded[0])
    }

    //Get benefit ids that were awarded and are still active
    const awardedAndActive = awardedRewards.filter(reward => activeRewardsIds.include(reward));

    //Count repetitions and positions of the awarded and active rewards, and return an object
    const countedRewardsObj = getCountAndPositions(awardedAndActive);

    //Convert to array and sort descending 
    const sortedRewards = Object.keys(countedRewardsObj)
        .map(key => { 
            return { benefitId: key, ...countedRewardsObj[key] }
        })
        .sort((a, b) => {
            return a['occurrences'] - b['occurrences'] || a['position'] - b['position'];
        });
    
    //Return the least awarded reward that has the lowest position in the rewards program
    return activeSpendingRewards.find(({ benefitId }) => benefitId === sortedRewards[0].benefitId);
}

//Helper function
const getCountAndPositions = rewards => {
    return rewards.reduce((accum, current, index) => {
        Object.assign(accum, { 
            [current]: {
                occurrences: (accum[current].occurrences || 0) + 1,
                position: accum[current].position || index
            } 
        });
    }, {})
}



module.exports = mongoose.model('Business', BusinessSchema);
