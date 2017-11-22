var express = require('express');
var Coupon = require('../models/coupon');
var router = express.Router();

router.post('/', couponPost);

function couponPost(request, response) {
  
}
