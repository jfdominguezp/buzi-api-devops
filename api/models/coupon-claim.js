var _            = require('lodash');
var mongoose     = require('mongoose');
var randomString = require('randomString');
var Schema       = mongoose.Schema;

var CouponClaimSchema = new Schema({
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

CouponClaimSchema.statics.claimCoupon = function(coupon, business, member, maxClaims, claimTimes, cb) {
    var CouponClaim = mongoose.model('CouponClaim', CouponClaimSchema);
    var newClaim = new CouponClaim();
    this.find({ couponId: coupon }, function(error, allClaims) {
        if(error) return cb(error);
        if(allClaims.length >= maxClaims) return cb('Max claims reached');
        var memberClaims = _.filter(allClaims, function(claim) {
            return claim.memberId == member;
        });
        if(memberClaims.length >= claimTimes) return cb("Member can not claim this coupon");

        var code = randomString.generate({ length: 5, capitalization: 'uppercase' });
        while(_.find(allClaims, { couponCode: code })){
            code = randomString.generate({ length: 5, capitalization: 'uppercase' });
        }

        newClaim.businessId = business;
        newClaim.memberId = member;
        newClaim.couponId = coupon;
        newClaim.couponCode = code;
        newClaim.actions = [{ action: 'Claim' }];
        newClaim.save(function(error, claim) {
            if(error) return cb(error);
            if(!claim) return cb(null, false);
            return cb(null, claim);
        });
    });
}

CouponClaimSchema.statics.getClaimsByMember = function(member, cb) {
    var CouponClaim = mongoose.model('CouponClaim', CouponClaimSchema);
    var newClaim = new CouponClaim();
    var populate = [
        {
            path: 'coupon',
            model: 'Coupon',
            select: 'shortId businessId name category productImages'
        },
        {
            path: 'business',
            model: 'Business',
            select: 'shortId name logo basicData.mapLocation'
        }
    ];

    this.find({ memberId: member })
        .sort({ createdAt: -1 })
        .populate(populate)
        .exec(function(error, claims) {
            if(error) return cb(error);
            return cb(null, claims);
        });
}

//Instance Methods
CouponClaimSchema.methods.useCoupon = function(cb) {
    if(_.find(this.actions, { action: 'Use' })) return cb('Coupon already used');
    this.actions.push({ action: 'Use' });
    this.save(cb); 
}

module.exports = mongoose.model('CouponClaim', CouponClaimSchema);
