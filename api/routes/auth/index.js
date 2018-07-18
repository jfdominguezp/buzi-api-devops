const express         = require('express');
const Business        = require('../../models/business');
const Member          = require('../../models/member');
const { createError } = require('../../errors/error-generator');
const wrapAsync       = require('../../errors/wrap-async');
const signup          = require('./signup');
const router          = express.Router();

const { INVALID_CREDENTIALS } = require('../../errors/error-types').auth;

router.post('/signup', wrapAsync(memberSignup))
      .post('/business/signup', wrapAsync(businessSignup));


async function memberSignup(request, response) {
    const member = new Member(request.body);
    await member.validate();
    const { email, password } = request.body;
    if (!email || !password) {
        throw createError(INVALID_CREDENTIALS, 'Incomplete credentials');
    }
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
    if (!email || !password || !username) {
        throw createError(INVALID_CREDENTIALS, 'Incomplete credentials');
    }
    const returnFields = ['_id', 'name', 'logo'];
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
