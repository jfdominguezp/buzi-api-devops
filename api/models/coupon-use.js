var mongoose     = require('mongoose');
var shortId      = require('shortid');
var Schema       = mongoose.Schema;

var CouponUseSchema = new Schema({
    shortId: { type: String, unique: true, default: shortId.generate },
    businessId: { type: String,  required: true },
    couponId: { type: String, required: true },
    code: { type: String, required: true },
    useDate: { type: Date, default: new Date() }
});

CouponUseSchema.index({ businessId: 1, couponId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('CouponUse', CouponUseSchema);
