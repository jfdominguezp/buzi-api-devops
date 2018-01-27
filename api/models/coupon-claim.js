var _ = require('lodash');
var mongoose = require('mongoose');
var randomString = require('randomString');
var Schema = mongoose.Schema;

var CouponClaim = new Schema({
    businessId: { type: String,  required: true },
    memberId: { type: String, required: true },
    couponId: { type: String, required: true },
    couponCode: { type: String, required: true },
    memberClaim: { type: Number, required: true },
    claimNumber: { type: Number, required: true },
    actions: [{
        date: { type: Date, default: Date.now() },
        action: { type: String, required: true }
    }]
},
{
    timestamps: true
});

CouponClaimSchema.index({ couponId: 1, couponCode: 1, memberClaim: 1 }, { unique: true });
CouponClaimSchema.index({ couponId: 1, claimNumber: 1 }, { unique: true });

CouponClaimSchema.statics.claimCoupon = function(coupon, business, member, maxClaims, repeatTimes, cb) {
    var newClaim = new mongoose.model('CouponClaim');
    this.count({ couponId: coupon }, function(error, count) {
        if(error) return cb(error);
        if(count && count >= maxClaims) return cb('Max claims reached');
        this.find({ couponId: coupon, memberId: member }, function(error, claims) {
            if(error) return cb(error);
            if(claims.length >= repeatTimes) return cb("Member can not claim this coupon");
            newClaim.businessId = business;
            newClaim.memberId = member;
            newClaim.couponId = coupon;

        });
    });
}

module.exports = mongoose.model('CouponClaim', CouponClaimSchema);
