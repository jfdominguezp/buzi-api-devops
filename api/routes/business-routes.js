const express  = require('express');
const Business = require('../models/business');
const router   = express.Router();

router.post('/', businessPost);

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


module.exports = router;
