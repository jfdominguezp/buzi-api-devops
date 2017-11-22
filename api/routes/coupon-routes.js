var express = require('express');
var Coupon = require('../models/coupon');
var router = express.Router();

router.post('/', couponPost);

function couponPost(request, response) {
  var body = request.body;
  var coupon = new Coupon();

  coupon.business = body.business;
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

module.exports = router;
