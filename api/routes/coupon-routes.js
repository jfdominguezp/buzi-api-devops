var express = require('express');
var Coupon = require('../models/coupon');
var mailing = require('../middleware/mailing.js');
var auth0 = require('../middleware/auth.js');
var _ = require('lodash');
var router = express.Router();

router.post('/', couponPost);
router.get('/:id', couponGet);
router.put('/:id/claim', claimCoupon);

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
  console.log('Claim Coupon');
  auth0.getPerson(request.body.userId)
    .then(function(users) {
      Coupon.claimCoupon(request.params.id, request.body.userId, function(error, coupon) {
        if(error) return response.status(400).json(error);
        if(!coupon) return response.status(404).json('Coupon not found');

        var claim = _.find(coupon.claims, { person: request.body.userId });
        mailing.sendCoupon(coupon, claim.code, users[0].email);
        return response.status(200).json({ code: claim.code });
      });
    })
    .catch(function(error) {
      return response.status(401).json(error);
    });
}

module.exports = router;
