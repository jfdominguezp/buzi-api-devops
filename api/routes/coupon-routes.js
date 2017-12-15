var express = require('express');
var Coupon = require('../models/coupon');
var CouponUse = require('../models/coupon-use');
var Business = require('../models/business');
var mailing = require('../middleware/mailing.js');
var auth0 = require('../middleware/auth.js');
var subscriptionIds = require('../util/subscription-ids.json');
var _ = require('lodash');
var router = express.Router();

router.get('/', couponsGetFiltered).post('/', couponPost);
router.get('/:id', couponGet);
router.put('/:id/claim', claimCoupon);
router.put('/:id/use', useCoupon);

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
    .select('-claims -_id -id')
    .populate({ path : 'owner', select: '-_id -userId', populate : { path : 'plan', select: '-_id' } })
    .exec(function(error, coupon) {
      if(error) {
        console.log(error);
        response.status(500).json(error);
      }else{
        coupon.claims = [];
        response.status(200).json(coupon);
      }
    });
}

function claimCoupon(request, response) {
  if(!request.body.userId) return response.status(400).json('Bad Request');
  auth0.getPerson(request.body.userId)
    .then(function(users) {
      if(!users || users.length < 1) return response.status(404).json('User not found');
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

function getAllActiveCoupons(request, response) {
  Coupon.find({ })
    .populate('owner')
    .exec(function(error, data) {
    if(error) return response.status(400).json(error);
    return response.status(200).json(data);
  });
}

function couponsGetFiltered(request, response) {
  var filter = request.query.ft;
  var categories = require('../util/coupon-categories.json');
  if(!filter || !categories[filter]) return response.status(404).json('Unknown category');

  if(categories[filter] === "featured") return getFeaturedCoupons(request, response);
  if(filter === "all") return getAllActiveCoupons(request, response);
  return getCouponsByCategory(categories[filter], request, response);
}

function getFeaturedCoupons(request, response) {
  var businessCriteria = [
    { 'subscription.subscriptionId': { $in: subscriptionIds.mainPage } },
    { 'subscription.active': true }
  ];
  var couponCriteria = [
    { 'initialDate': { $lt: new Date() } },
    { 'finalDate': { $gt: new Date() } }
  ];
  return queryCoupons(businessCriteria, couponCriteria, request, response);
}

function getCouponsByCategory(category, request, response) {
  var businessCriteria = [
    { 'subscription.active': true }
  ];
  var couponCriteria = [
    { 'category': category },
    { 'initialDate': { $lt: new Date() } },
    { 'finalDate': { $gt: new Date() } }
  ];
  return queryCoupons(businessCriteria, couponCriteria, request, response);
}

function queryCoupons(businessCriteria, couponCriteria, request, response) {
  Business.distinct('shortId', { $and: businessCriteria },
    function(error, businesses) {
      if(error) return response.status(400).json(error);
      Coupon
        .find({
          $and: [
            { 'businessId': { $in: businesses } },
            { $and: couponCriteria }
          ]
        })
        .select('-claims -_id -id')
        .populate({ path : 'owner', select: '-_id -userId', populate : { path : 'plan', select: '-_id' } })
        .exec(function(error, coupons){
          if(error) return response.status(400).json(error);
          return response.status(200).json(coupons);
        });
    });
}

function useCoupon(request, response) {
  if(!request.body.code || !request.body.businessId || !request.params.id) return response.status(400).json('Bad Request');
  Business.findOne({ userId: request.body.businessId }, 'shortId' , function(error, business) {
    if(error) return response.status(400).json(error);
    if(!business || !business.shortId) return response.status(404).json('Specified business does not exist');
    return Coupon.findOne({ 'businessId': business.shortId, 'shortId': request.params.id, 'claims.code': request.body.code },
      function(error, coupon) {
        if(error) return response.status(400).json(error);
        if(!coupon)  return response.status(404).json('Invalid coupon Id or claim code');
        var couponUse = new CouponUse();
        couponUse.businessId = request.body.businessId;
        couponUse.couponId = request.params.id;
        couponUse.code = request.body.code;
        couponUse.save(function(error, couponUse) {
          if(error) return response.status(404).json('Code already used');
          return response.status(200).json({ coupon: request.params.id, code: request.body.code });
        });
      });
  });
}

module.exports = router;
