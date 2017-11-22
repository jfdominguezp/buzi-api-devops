var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var couponSchema = new Schema({
  business: {type: mongoose.Schema.Types.ObjectId,  ref: 'Business'},
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  productImages: [String],
  termsAndConditions: { type: String, required: true },
  branches: [String],
  forDelivery: { type: Boolean, required: true },
  coupons: { type: Number, required: true, min: 1 },
  initialDate: { type: Date, required: true },
  finalDate: { type: Date, required: true },
  claims: [{
    user: { type: String, required: true },
    code: { type: String, required: true },
  }]
});

var Coupon = mongoose.model('Coupon', couponSchema);
