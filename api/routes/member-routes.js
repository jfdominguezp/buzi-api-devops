var express = require('express');
var auth    = require('../auth/auth');
var CouponClaim = require('../models/coupon-claim');
var router  = express.Router();

router.get('/', auth.authenticateMember(), getMember)
      .get('/coupons', auth.authenticateMember(), getMemberCoupons);

function getMember(request, response) {
    response.json(request.user);
}

function getMemberCoupons(request, response) {
    var member = request.user.memberId;
    CouponClaim.getClaimsByMember(member, function(error, claims) {
        if(error) return response.status(500).json(error);
        return response.json(claims);
    });
}

module.exports = router;
