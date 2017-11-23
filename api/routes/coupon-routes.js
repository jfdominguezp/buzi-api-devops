var express = require('express');
var Coupon = require('../models/coupon');
var router = express.Router();

router.post('/', couponPost);
router.get('/:id', couponGet);
router.put('/:id/claim');

function couponPost(request, response) {
  var body = request.body;
  var coupon = new Coupon();

  coupon.businessId = body.businessId;
  coupon.name = body.name;
  coupon.description = body.description;
  coupon.category = body.category;
  coupon.productImages = body.productImages;
  coupon.termsAndConditions = body.termsAndConditions;
  coupon.branches = body.branches;
  coupon.forDelivery = body.forDelivery;
  coupon.coupons = body.coupons;
  coupon.initialDate = body.initialDate;
  coupon.finalDate = body.finalDate;

  coupon.save(function(error, data){
    if(error) {
      console.log(error);
      response.status(500).json(error);
    }else{
      response.status(200).json(data);
    }
  });
}

function couponGet(request, response) {
  Coupon.findOne({ 'shortId': request.params.id })
    .populate({ path : 'owner', populate : { path : 'plan' } })
    .exec(function(error, coupon) {
      if(error) {
        console.log(error);
        response.status(500).json(error);
      }else{
        response.status(200).json(coupon);
      }
    });
}

function claimCoupon(request, response) {

}

module.exports = router;
