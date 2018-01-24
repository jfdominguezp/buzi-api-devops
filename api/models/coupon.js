var _ = require('lodash');
var mongoose = require('mongoose');
var randomString = require('randomString');
var shortId = require('shortid');
var Schema = mongoose.Schema;

var CouponSchema = new Schema({
    shortId: { type: String, unique: true, default: shortId.generate },
    businessId: { type: String,    required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    productImages: [String],
    termsAndConditions: { type: String, required: true },
    branches: [mongoose.Schema.Types.ObjectId],
    forDelivery: { type: Boolean, required: true },
    coupons: { type: Number, required: true, min: 1 },
    initialDate: { type: Date, required: true },
    finalDate: { type: Date, required: true },
    claims: [{
        person: { type: String, required: true },
        code: { type: String, required: true },
        status: { type: String, default: 'Unused' },
        claimDate: { type: Date },
        useDate: { type: Date }
    }],
    claimedCoupons: { type: Number, default: 0 }
},
{
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

CouponSchema.virtual('owner', {
    ref: 'Business',
    localField: 'businessId',
    foreignField: 'shortId',
    justOne: true
});

CouponSchema.virtual('availableCoupons').get(function() {
    return this.coupons - this.claimedCoupons;
});

CouponSchema.statics.claimCoupon = function(couponId, personId, cb) {
    this.findOne({ 'shortId': couponId })
        .populate({ path : 'owner', populate : { path : 'plan' } })
        .exec(function(error, coupon) {
            if (error || !coupon) return cb(error, coupon);
            if (coupon.availableCoupons == 0) return cb("All coupons claimed", null);
            if (_.find(coupon.claims, { person: personId })) return cb("User already claimed this coupon", null);
            var newCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
            while(_.find(coupon.claims, { code: newCode })){
                newCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
            }
            coupon.claims.push({
                person: personId,
                code: newCode,
                claimDate: new Date()
            });
            coupon.claimedCoupons++;
            return coupon.save(cb);
        });
}

module.exports = mongoose.model('Coupon', CouponSchema);
