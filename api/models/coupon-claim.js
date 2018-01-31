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
    timestamps: true
});

CouponClaimSchema.index({ couponId: 1, couponCode: 1 }, { unique: true });

CouponClaimSchema.statics.claimCoupon = function(coupon, business, member, maxClaims, claimTimes, cb) {
    var CouponClaim = mongoose.model('CouponClaim', CouponClaimSchema);
    var newClaim = new CouponClaim();
    this.find({ couponId: coupon }, function(error, allClaims) {
        if(error) return cb(error);
        console.log(allClaims);
        console.log(maxClaims);
        if(allClaims.length >= maxClaims) return cb('Max claims reached');
        console.log(member);
        var memberClaims = _.filter(allClaims, { memberId: member });
        console.log(memberClaims);
        console.log(claimTimes);
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

module.exports = mongoose.model('CouponClaim', CouponClaimSchema);
