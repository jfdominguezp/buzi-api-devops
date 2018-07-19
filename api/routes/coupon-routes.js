var express         = require('express');
var _               = require('lodash');
var Coupon          = require('../models/coupon');
var CouponClaim     = require('../models/coupon-claim');
var Business        = require('../models/business');
var mailing         = require('../middleware/mailing.js');
var auth            = require('../auth/auth');
var router          = express.Router();

router.get('/', couponsGetFiltered).post('/', couponPost).get('/:id', couponGet)
      .put('/:id/claim', [auth.authenticateMember(), auth.verifyMemberOwnership], claimCoupon)
      .put('/:id/use', [auth.authenticateBusiness(), auth.verifyCouponOwnership], useCoupon);

//POST Methods
function couponPost(request, response) {
    var body = request.body;

    var coupon = new Coupon(body);

    coupon.save(function(error, data){
        if(error) return response.status(500).json(error);
        return response.status(200).json(data);
    });
}


//GET Methods
function couponGet(request, response) {
    Coupon.findOne({ 'shortId': request.params.id })
        .select('-claims -_id -id')
        .populate({ path : 'owner', select: '-_id -userId', populate : { path : 'plan', select: '-_id' } })
        .exec(function(error, coupon) {
            if(error) return response.status(500).json(error);
            if(!coupon) return response.status(404).json('Coupon not found');
            return response.status(200).json(coupon);
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
        //Filter business by subscription criteria in the future
        { }
    ];
    var couponCriteria = [
        { 'initialDate': { $lt: new Date() } },
        { 'finalDate': { $gt: new Date() } }
    ];
    return queryCoupons(businessCriteria, couponCriteria, request, response);
}

function getCouponsByCategory(category, request, response) {
    var businessCriteria = [
        //Filter business by subscription criteria in the future
        {  }
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

//PUT Methods
function claimCoupon(request, response) {
    var user = request.user;
    Coupon.findOne({ shortId: request.params.id }).populate('owner').exec(function(error, coupon) {
        if(error) return response.status(400).json(error);
        if(!coupon) return response.status(404).json('Coupon not found');
        if(coupon.finalDate < Date.now() || coupon.initialDate > Date.now()) return response.status(403).json('Inactive coupon');

        CouponClaim.claimCoupon(coupon.shortId, coupon.businessId, user.memberId, coupon.coupons, process.env.MAX_MEMBER_CLAIMS, function(error, claim) {
            if(error) return response.status(400).json(error);
            if(!claim) return response.status(404).json('Can not claim');
            response.status(200).json(claim);
            mailing.sendCoupon(coupon, claim.couponCode, user);
        });

    });

}

function useCoupon(request, response) {
    var user = request.user;
    var businessId = user.shortId;
    var couponId = request.params.id;
    var code = request.body.code;

    CouponClaim.useCoupon(couponId, businessId, code, function(error, claim) {
        if(error) return response.status(500).json(error);
        if(!claim) return response.status(500).json('Error using coupon');
        return response.status(200).json(claim);
    });
}

module.exports = router;
