var express = require('express');
var Business = require('../models/business');
var router = express.Router();

router.post('/', businessPost);

function businessPost(request, response) {
  var body = request.body;
  var business = new Business();

  business.name = body.name;
  business.userId = body.userId;
  business.hasBranches = body.hasBranches;
  business.subscription = body.subscription;
  business.basicData = body.basicData;
  business.contactData = body.contactData;
  business.internetData = body.internetData;
  business.branches = body.branches;

  business.save(function(error, data){
    if(error) {
      console.log(error);
      response.status(500).json(error);
    }else{
      response.status(200).json(data);
    }
  });

}

module.exports = router;
