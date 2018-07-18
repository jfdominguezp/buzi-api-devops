const express         = require('express');
const Business        = require('../../models/business');
const Member          = require('../../models/member');
const { createError } = require('../../errors/error-generator');
const wrapAsync       = require('../../errors/wrap-async');
const signup          = require('./signup');
const signin          = require('./signin');
const router          = express.Router();

const { INVALID_CREDENTIALS } = require('../../errors/error-types').auth;

router.post('/signup', wrapAsync(memberSignup))
      .post('/signin', wrapAsync(memberSignin))
      .post('/business/signup', wrapAsync(businessSignup))
      .post('/business/signin', wrapAsync(businessSignin));

//Members
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

async function memberSignin(request, response) {
    const { email, password } = request.body;
    if (!email || !password) {
        throw createError(INVALID_CREDENTIALS, 'Incomplete credentials');
    }
    const returnFields = ['_id', 'name', 'familyName'];
    const authenticatedUser = await signin({ email, password }, 'Member', 'People', returnFields);
    response.status(200).json(authenticatedUser);
}

//Businesses
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

async function businessSignin(request, response) {
    const { email, username, password } = request.body;
    if ((!username && !email) || !password) {
        throw createError(INVALID_CREDENTIALS, 'Incomplete credentials');
    }
    const returnFields = ['_id', 'name', 'logo'];
    const authenticatedUser = await signin({ email, username, password }, 'Business', 'Businesses', returnFields);
    response.status(200).json(authenticatedUser);
}

module.exports = router;
