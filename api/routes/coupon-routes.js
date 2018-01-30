var express         = require('express');
var _               = require('lodash');
var Coupon          = require('../models/coupon');
var CouponClaim     = require('../models/coupon-claim');
var Business        = require('../models/business');
var mailing         = require('../middleware/mailing.js');
var auth0           = require('../middleware/auth.js');
var subscriptionIds = require('../util/subscription-ids.json');
var auth            = require('../auth/auth');
var router          = express.Router();

router.get('/', couponsGetFiltered).post('/', couponPost);
router.get('/:id', couponGet);
router.put('/:id/claim', [auth.authenticateMember, auth.verifyMemberOwnership], claimCoupon);
router.put('/:id/use', useCoupon);

//POST Methods
function couponPost(request, response) {
    var body = request.body;

    var coupon = new Coupon(body);
    coupon.availableCodes = Coupon.getCodes();

    coupon.save(function(error, data){
        if(error) {
            console.log(error);
            response.status(500).json(error);
        }else{
            response.status(200).json(data);
        }
    });
}


//GET Methods
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

//PUT Methods
function claimCoupon(request, response) {
    var user = request.user;
    var claim = new CouponClaim();
}

function useCoupon(request, response) {

}

module.exports = router;
