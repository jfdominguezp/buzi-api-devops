var express   = require('express');
var mailing   = require('../middleware/mailing.js');
var validator = require('email-validator');
var router    = express.Router();

router.post('/contact', contact);

function contact(request, response) {
    var data = request.body;

    if(!data.name || !data.subject || !data.message || !data.email || !validator.validate(data.email)){
        return response.status(400).json('Bad request');
    }

    mailing.sendGenericMessage(data.name, data.email, data.subject, data.message, process.env.CONTACT_US_EMAIL)
        .then(function(){
            return response.status(200).json('OK');
        })
        .catch(function(error) {
            return response.status(400).json('Error');
        })
}

module.exports = router;
