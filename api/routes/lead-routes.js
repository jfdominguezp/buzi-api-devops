var express      = require('express');
var BusinessLead = require('../models/business-lead');
var router       = express.Router();

router.post('/', businessLeadPost);

function businessLeadPost(request, response) {
    var body = request.body;
    var lead = new BusinessLead();

    lead.name = body.name;
    lead.phone = body.phone;
    lead.email = body.email;
    lead.business = body.business;
    lead.city = body.city;

    lead.save(function(error, data){
        if(error) {
            console.log(error);
            response.status(500).json(error);
        }else{
            response.status(200).json(data);
        }
    });
}

module.exports = router;
