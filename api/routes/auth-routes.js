const express       = require('express');
const mongoose      = require('mongoose');
const jwt           = require('jsonwebtoken');
const randtoken     = require('rand-token');
const bcrypt        = require('bcrypt');
const LocalUser     = require('../models/local-user');
const RefreshToken  = require('../models/refresh-token');
const VerifyToken   = require('../models/verify-token');
const ResetToken    = require('../models/reset-token');
const Member        = require('../models/member');
const Business      = require('../models/business');
const config        = require('../../config/server-config').authConfig;
const mailing       = require('../middleware/mailing');
const emailValidate = require('email-validator');
const router        = express.Router();

router.post('/login', memberLogin).post('/token', token).post('/signup', memberSignup)
      .post('/reset', memberStartReset).post('/business/reset', businessStartReset)
      .put('/reset', memberEndReset).put('/business/reset', businessEndReset)
      .post('/business/signup', businessSignup).post('/business/login', businessLogin)
      .get('/verify', verifyAccount);

//Login Functions

function memberLogin(request, response) {
    const returnFields = ['_id', 'name', 'familyName'];
    login(returnFields, false, 'People', 'Member', request, response);
}

function businessLogin(request, response) {
    const returnFields = ['_id', 'shortId', 'name', 'logo'];
    login(returnFields, true, 'Businesses', 'Business', request, response);
}

//Password Reset Functions

function businessStartReset(request, response) {
    startReset('Businesses', request, response);
}

function memberStartReset(request, response) {
    startReset('People', request, response);
}

function businessEndReset(request, response) {
    endReset('Businesses', request, response);
}

function memberEndReset(request, response) {
    endReset('People', request, response);
}

//Signup Functions

function memberSignup(request, response) {
    const returnFields = ['_id', 'name', 'familyName'];
    signup('Member', Member, 'People', returnFields, false, true, request, response);
}

function businessSignup(request, response) {
    const returnFields = ['shortId', 'name', 'logo'];
    signup('Business', Business, 'Businesses', returnFields, true, true, request, response);
}

//Refresh Token Functions

function token(request, response) {
    const { refreshToken, userId } = request.body;

    if(!refreshToken) return response.status(400).json('Bad Request');
    RefreshToken.getToken(refreshToken, userId, (error, token) => {
        if(error) return response.status(401).json(error);
        if(!token) return response.status(401).json('Bad refresh token');
        if(!token.isSocial) {
            LocalUser.findOne({ _id: userId }, (error, user) => {
                if(error) return response.status(401).json(error);
                if(!user) return response.status(404).json('User does not exist');
                RefreshToken.updateLastAccess(refreshToken, userId);
                return response.status(200).json({ accessToken: issueAccessToken(user, false) });
            });
        }
    });
}

/*
 * Verify Account Functions
 * Query format: ?id=AAAAAAAAA&token=XXXXXXX&provider=BBBBB&social=XXXXXX
 */

function verifyAccount(request, response) {

    const { userId, token, provider, isSocial } = request.query;

    if(!userId || !token || !provider || isSocial == null || isSocial == undefined){
        return response.status(400).json('Bad Request');
    }

    VerifyToken.useToken(token, userId, provider, isSocial, (error) => {
        if(error) return response.status(400).json(error);
        LocalUser.markEmailVerified(userId, (error, { _id, email_verified }) => {
            if(error) return response.status(500).json(error);
            return response.status(200).json({ _id, email_verified });
        });
    });
}

function startVerification(userId, provider, isSocial, name, email) {
    VerifyToken.generateToken(userId, provider, isSocial, (error, token) => {
        if(!error && token) {
            const query = `id=${userId}&token=${token.token}&p=${provider}&social=${isSocial}`;
            mailing.sendVerificationEmail(name, email, query);
        }
    });
}

/*
 * Reset Password Functions
 * Query format: ?id=XXXXXX&token=YYYYYY
 */

function startReset(connection, request, response) {
    const email = request.body.email;
    if(!email || !emailValidate.validate(email))  return response.status(400).json('Bad Request');
    LocalUser.findOne({ email, connection }, (error, user) => {
        if(error) return response.status(500).json(error);
        if(!user) return response.status(404).json('User does not exist');
        ResetToken.generateToken(user._id, (error, token) => {
            if(error) return response.status(500).json(error);
            const query = `id=${user._id}&token=${token.token}`;
            mailing.sendPasswordReset(email, query, connection);
        });
        return response.status(200).json('Change Requested');
    });
}

function endReset(connection, request, response) {
    const { token, id, password } = request.body;

    if(!token || !id || !password) return response.status(400).json('Bad Request');

    ResetToken.useToken(id, token, (error) => {
        if(error) return response.status(401).json(error);
        LocalUser.changePassword(connection, id, password, (error) => {
            if(error) return response.status(500).json(error);
            return response.status(200).json('Password Changed');
        });
    });
}

//Generic Functions

//TODO Check returnFields assignment
function signup(model, modelSchema, connection, returnFields, usernameRequired, loginAfterSave, request, response) {
    const body = request.body;
    const user = new modelSchema(body);

    user.validate((error) => {
        if(error) return response.status(400).json(error);
        insertUser(body, connection, usernameRequired, (error, newUser) => {
            if(error) {
                if(error.code && error.code == 11000) return response.status(400).json('User already exists');
                return response.status(500).json('Unexpected error');
            }
            if(!newUser) return response.status(500).json('Unexpected error');
            const newIdentity = { userId: newUser._id, provider: 'Local', isSocial: false };
            user.identities.push(newIdentity);
            user.save((error, data) => {
                if(error) return response.status(500).json('Unexpected error');
                if(!loginAfterSave) return response.status(200).json(data);
                const tokenSet = { accessToken: issueAccessToken(newUser, false), refreshToken: randtoken.generate(16) };
                const resData = { };
                returnFields.forEach(field => { resData[field] = data[field] });
                startVerification(newUser._id, 'Local', false, data.name, newUser.email);
                storeRefreshToken(newUser._id, tokenSet.refreshToken, 'Local', false, (error, data) => {
                    if(error || !data) return response.status(401).json('Login error');
                    return response.status(200).json({ userId: newUser._id, data: resData, tokens: tokenSet });
                });
            });
        });
    });
}

//TODO Check returnFields assignment
function login(returnFields, usernameRequired, connection, model, request, response) {
    const credentials = { password: request.body.password };
    if(usernameRequired) {
        credentials.username = request.body.username;
    } else {
        credentials.email = request.body.email;
    }
    authenticateCredentials(credentials, usernameRequired, connection, (error, user) => {
        if(error) return response.status(401).json(error);
        if(!user) return response.status(404).json('User does not exist');
        const tokenSet = { accessToken: issueAccessToken(user, false), refreshToken: randtoken.generate(16) };
        const query = { 'identities.userId': user._id, 'identities.provider': 'Local', 'identities.isSocial': false };
        mongoose.model(model).findOne(query, (error, data) => {
            if(error || !data) return response.status(401).json('Auth error');
            const resData = { };
            returnFields.forEach(field => { resData[field] = data[field] });
            storeRefreshToken(user._id, tokenSet.refreshToken, 'Local', false, (error, data) => {
                if(error || !data) return response.status(401).json('Login error');
                return response.status(200).json({ userId: user._id, data: resData, tokens: tokenSet });
            });
        });
    });
}

function authenticateCredentials({ email, password, username }, usernameRequired, connection, cb) {
    if(password) return cb('Password required');
    if(usernameRequired && !username) return cb('Username required');
    if(!usernameRequired && !email) return cb('Email required');

    const query = { email, username, connection };

    LocalUser.findOne(query, (error, user) => {
        if(error) return cb('Authentication Error');
        if(!user) return cb(null, null);
        user.passwordMatch(password, (error, isMatch) => {
            if(error) return cb(error);
            if(!isMatch) return cb('Wrong password');
            return cb(null, user);
        });
    });

}

function insertUser({ email, password, username }, connection, usernameRequired, cb){
    if( !connection || !email || !password || (usernameRequired && !username) || (!usernameRequired && username)) {
        return cb('Invalid credentials', null);
    }

    bcrypt.hash(password, 10, (error, passwordHash) => {
        if(error || !passwordHash) return cb(error);
        const newUser = new LocalUser({ email, passwordHash, connection });
        return newUser.save(cb);
    });
}

function issueAccessToken({ _id, email, connection, username }, isSocial) {
    const payload = {
        _id,
        email,
        username,
        connection,
        isSocial
    };
    const options = {
        expiresIn: 900,
        issuer: config.issuer
    };
    const token = jwt.sign(payload, config.jwtSecret, options);
    return token;
}

function storeRefreshToken(userId, token, provider, isSocial, cb) {
    const refresh = new RefreshToken({
        token,
        userId,
        provider,
        isSocial
    });
    refresh.save(cb);
}

module.exports = router;
