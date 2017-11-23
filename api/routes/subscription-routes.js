var express = require('express');
var Subscription = require('../models/subscription');
var router = express.Router();

router.post('/', subscriptionPost);

function subscriptionPost(request, response) {
  var body = request.body;
  var subscription = new Subscription();

  subscription.maxActiveCoupons = body.maxActiveCoupons;
  subscription.mainPage = body.mainPage;
  subscription.cycleDays = body.cycleDays;
  subscription.benefits = body.benefits;
  subscription.offers = body.offers;
  subscription.name = body.name;
  subscription.priority = body.priority;

  subscription.save(function(error, data){
    if(error) {
      console.log(error);
      response.status(500).json(error);
    }else{
      response.status(200).json(data);
    }
  });

}

module.exports = router;
