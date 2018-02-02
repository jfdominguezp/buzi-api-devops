var express  = require('express');
var Business = require('../models/business');
var Coupon   = require('../models/coupon');
var router   = express.Router();

router.post('/', businessPost);
router.get('/:userId/coupons', getBusinessCoupons);

function businessPost(request, response) {
    var body = request.body;
    var business = new Business(body);

    business.save(function(error, data){
        if(error) {
            console.log(error);
            response.status(500).json(error);
        }else{
            response.status(200).json(data);
        }
    });
}

function getBusinessCoupons(request, response) {
    var businessId = request.params.userId;
    if(!businessId) return response.status(400).json('Bad Request');

    Business.findOne({ userId: businessId }, 'shortId', function(error, business){
        if(error) return response.status(500).json('Error');
        if(!business || !business.shortId) return response.status(404).json('The specified business does not exist');
        Coupon.find({ businessId: business.shortId }, function(error, coupons) {
            if(error) return response.status(500).json('Error');
            return response.status(200).json(coupons);
        });
    });
}

module.exports = router;
