const express   = require('express');
const Business  = require('../../models/business');
const Member    = require('../../models/member');
const wrapAsync = require('../../errors/wrap-async');
const signup    = require('./signup');
const router    = express.Router();

router.post('/signup', wrapAsync(memberSignup))
      .post('/business/signup', wrapAsync(businessSignup));


async function memberSignup(request, response) {
    const member = new Member(request.body);
    await member.validate();
    const { email, password } = request.body;
    const returnFields = ['_id', 'name', 'familyName'];
    const resData = await signup(
        { email, password },
        member,
        'People',
        returnFields,
        false
    );
    response.status(200).json(resData);
}

async function businessSignup(request, response) {
    const business = new Business(request.body);
    await business.validate();
    const { email, password, username } = request.body ;
    const returnFields = ['shortId', 'name', 'logo'];
    const resData = await signup(
        { email, password, username }, 
        business, 
        'Businesses', 
        returnFields, 
        true
    );
    response.status(200).json(resData);
}

module.exports = router;
