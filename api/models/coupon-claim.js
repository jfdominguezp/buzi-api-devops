const _            = require('lodash');
const mongoose     = require('mongoose');
const randomString = require('randomstring');
const Schema       = mongoose.Schema;

const CouponClaimSchema = new Schema({
    businessId: { type: String,  required: true },
    memberId: { type: String, required: true },
    couponId: { type: String, required: true },
    couponCode: { type: String, required: true },
    actions: [{
        date: { type: Date, default: Date.now() },
        action: { type: String, required: true }
    }]
},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

CouponClaimSchema.index({ couponId: 1, couponCode: 1 }, { unique: true });

CouponClaimSchema.virtual('coupon', {
    ref: 'Coupon',
    localField: 'couponId',
    foreignField: 'shortId',
    justOne: true
});

CouponClaimSchema.virtual('business', {
    ref: 'Business',
    localField: 'businessId',
    foreignField: 'shortId',
    justOne: true
});


//Static Methods

CouponClaimSchema.statics.claimCoupon = (couponId, businessId, memberId, maxClaims, claimTimes, cb) => {
    const CouponClaim = mongoose.model('CouponClaim', CouponClaimSchema);
    this.where({ couponId }).count((error, count) => {
        if (error) return cb(error);
        if (count >= maxClaims) return cb('Max claims reached');
        this.find({ couponId, memberId }, (error, claims) => {
            if (error) return cb(error);
            if (claims.length >= claimTimes) return cb("Member can not claim this coupon");
            let couponCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
            while(_.find(claims, { couponCode })){
                couponCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
            }
            const newClaim = new CouponClaim({ 
                businessId,
                memberId,
                couponId,
                couponCode,
                actions: [{ action: 'Claim' }]  
            });
            newClaim.save(cb);
        });
    });
};

//TODO Refactor from here
CouponClaimSchema.statics.getClaimsByMember = (memberId, cb) => {
    const populate = [
        {
            path: 'coupon',
            model: 'Coupon',
            select: 'shortId businessId name category productImages initialDate finalDate'
        },
        {
            path: 'business',
            model: 'Business',
            select: 'shortId name logo basicData.mapLocation'
        }
    ];

    this.find({ memberId })
        .sort({ createdAt: -1 })
        .populate(populate)
        .exec((error, claims) => {
            if(error) return cb(error);
            return cb(null, claims);
        });
};

CouponClaimSchema.statics.useCoupon = (couponId, businessId, couponCode, cb) => {
    this.findOne({ couponId, businessId, couponCode }, (error, claim) => {
        if(error) return cb(error);
        if(!claim) return cb('Claim does not exist');
        if(_.find(claim.actions, { action: 'Use' })) return cb('Coupon already used');
        claim.actions.push({ action: 'Use' });
        return claim.save(cb);
    });
}

module.exports = mongoose.model('CouponClaim', CouponClaimSchema);
