var shortId = require('shortid');
var randomString = require('randomString');
var _ = require('lodash');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CouponSchema = new Schema(
  {
    shortId: { type: String, unique: true, default: shortId.generate },
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
    claims: {
      type: [{
        person: { type: String, required: true, unique: true },
        code: { type: String, required: true, unique: true },
        status: { type: String, default: 'Unused' }
      }],
      validate: [arrayLimit, '{PATH} exceeds the limit']
    }
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

CouponSchema.virtual('availableCoupons').get(function() {
  return this.coupons - this.claims.length;
});

CouponSchema.methods.claim = function(personId, cb) {
  if(this.claims.length >= this.availableCoupons) return cb("All coupons claimed", null);
  var newCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
  while(_.find(this.claims, { code: newCode })){
    newCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
  }
  this.claims.push({
    person: personId,
    code: newCode
  })

  return this.save(cb);
}



module.exports = mongoose.model('Coupon', CouponSchema);
