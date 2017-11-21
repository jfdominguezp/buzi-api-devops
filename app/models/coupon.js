var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var couponSchema = new Schema({
  name: String,
  description: String,
  category: String,
  productImages: [String],
  termsAndConditions: String,
  branches: [String],
  forDelivery: Boolean,
  maxCoupons: Number,
  initialDate: Date,
  finalDate: Date,
  claims: [{
    user: String,
    code: String,
  }]
});

var Coupon = mongoose.model('Coupon', couponSchema);
