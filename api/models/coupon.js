var shortId = require('shortid');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CouponSchema = new Schema(
  {
    shortId: {type: String, unique: true, default: shortId.generate},
    businessId: {type: String,  required: true},
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
      user: { type: String, required: true },
      code: { type: String, required: true },
    }]
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

CouponSchema.virtual('owner', {
  ref: 'Business',
  localField: 'businessId',
  foreignField: 'shortId',
  justOne: true
});

module.exports = mongoose.model('Coupon', CouponSchema);
