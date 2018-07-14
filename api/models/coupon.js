var mongoose     = require('mongoose');
var shortId      = require('shortid');
var Schema       = mongoose.Schema;

var CouponSchema = new Schema({
    shortId: { type: String, unique: true, default: shortId.generate },
    businessId: { type: String,  required: true },
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
    claimedCoupons: { type: Number, default: 0 }
},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

CouponSchema.virtual('owner', {
    ref: 'Business',
    localField: 'businessId',
    foreignField: 'shortId',
    justOne: true
});

CouponSchema.virtual('availableCoupons').get(() => {
    this.coupons - this.claimedCoupons;
});

module.exports = mongoose.model('Coupon', CouponSchema);
