const express  = require('express');
const Business = require('../models/business');
const Coupon   = require('../models/coupon');
const router   = express.Router();

router.post('/', businessPost);
router.get('/:userId/coupons', getBusinessCoupons);

function businessPost(request, response) {
    const business = new Business(request.body);
    business.save((error, data) => {
        if(error) {
            console.log(error);
            response.status(500).json(error);
        }else{
            response.status(200).json(data);
        }
    });
}

//TODO Change function according to model adjustment
function getBusinessCoupons(request, response) {
    const businessId = request.params.userId;
    if(!businessId) return response.status(400).json('Bad Request');

    Business.findOne({ 'identities.userId': businessId }, 'shortId', (error, business) => {
        if(error) return response.status(500).json('Error');
        if(!business || !business.shortId) return response.status(404).json('The specified business does not exist');
        Coupon.find({ businessId: business.shortId }, function(error, coupons) {
            if(error) return response.status(500).json('Error');
            return response.status(200).json(coupons);
        });
    });
}

module.exports = router;
