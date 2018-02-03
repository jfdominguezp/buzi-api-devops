var express      = require('express');
var mongoose     = require('mongoose');
var jwt          = require('jsonwebtoken');
var randtoken    = require('rand-token');
var bcrypt       = require('bcrypt');
var LocalUser    = require('../models/local-user');
var RefreshToken = require('../models/refresh-token');
var Member       = require('../models/member');
var config       = require('../../config/server-config').authConfig;
var router       = express.Router();

router.post('/login', memberLogin).post('/token', token).post('/signup', memberSignup)
      .post('/business/signup');

//Login Functions
function memberLogin(request, response) {
    var queryFields = {
        id: 'identities.userId',
        provider: 'identities.provider',
        providerValue: 'Local'
    };
    var returnFields = ['_id', 'name', 'familyName'];
    login(queryFields, returnFields, false, 'People', 'Member', request, response);
}

function businessLogin(request, response) {
    var queryFields = {
        idField: 'identities.userId',
    };
    var returnFields = ['shortId', 'name', 'logo'];
    login(queryFields, returnFields, true, 'Businesses', 'Business', request, response);
}

//Signup Functions
function memberSignup(request, response) {
    var user = request.body;
    if(!user || !user.name || !user.familyName || !user.email) {
        return response.status(400).json('Incomplete profile');
    }
    insertUser(user, 'People', false, function(error, localUser) {
        if(error) return response.status(401).json(error);
        var member = new Member();
        member.name = user.name;
        member.familyName = user.familyName;
        member.identities = [{
            userId: localUser._id,
            provider: 'Local',
            isSocial: false
        }];
        member.save(function(error, member) {
            if(error) return response.status(401).json(error);
            var tokenSet = { accesToken: issueAccessToken(localUser, false), refreshToken: randtoken.generate(16) };
            storeRefreshToken(localUser._id, tokenSet.refreshToken, 'Local', false, function(error, data) {
                if(error || !data) response.status(401).json('Auth error');
                return response.status(200).json({ userData: member, tokens: tokenSet });
            });
        });
    });
}

function businessSignup(request, response) {
    var body = request.body;
    if(!body || !body.email || !body.username || !body.password) {
        return response.status(400).json('Incomplete credentials');
    }
    var business = new Business(body);

    business.validate(function(error) {
        if(error) return response.status(400).json('Bad business data');
        insertUser(body, 'Businesses', true, function(error, user) {
            if(error) return response.status(401).json(error);
            if(!user) return response.status(500).json('Unexpected error');
            this.userId = user._id;
            this.save(function(error, business) {
                if(error) return response.status(401).json(error);
                var tokenSet = { accesToken: issueAccessToken(user, false), refreshToken: randtoken.generate(16) };
                storeRefreshToken(user._id, tokenSet.refreshToken, 'Local', false, function(error, data) {
                    if(error || !data) response.status(401).json('Login error');
                    var businessData = { name: business.name, logo: business.logo, shortId: business.shortId };
                    return response.status(200).json({ userData: businessData, tokens: tokenSet });
                });
            });

        });
    });
}

//Refresh Token Functions
function token(request, response) {
    var refresh = request.body.refreshToken;
    var userId  = request.body.userId;

    if(!refresh) return response.status(400).json('Bad Request');
    RefreshToken.getToken(refresh, userId, function(error, token) {
        if(error) return response.status(401).json(error);
        if(!token) return response.status(401).json('Bad refresh token');
        if(!token.isSocial) {
            LocalUser.findOne({ _id: userId }, function(error, user) {
                if(error) return response.status(401).json(error);
                if(!user) return response.status(404).json('User does not exist');
                RefreshToken.updateLastAccess(refresh, userId);
                return response.status(200).json({ accessToken: issueAccessToken(user, false) });
            });
        }
    });
}

//Generic Functions
function login(queryFields, returnFields, usernameRequired, connection, model, request, response) {
    var credentials = { password: request.body.password };
    if(usernameRequired) {
        credentials.username = request.body.username;
    } else {
        credentials.email = request.body.email;
    }
    authenticateCredentials(credentials, usernameRequired, connection, function(error, user) {
        if(error) return response.status(401).json(error);
        var tokenSet = { accessToken: issueAccessToken(user, false), refreshToken: randtoken.generate(16) };
        var query = { };
        query[queryFields.id] = user._id;
        if(queryFields.provider && queryFields.providerValue) {
            query[queryFields.provider] = queryFields.providerValue;
        }
        mongoose.model(model).findOne(query, function(error, data) {
            if(error || !data) return response.status(401).json('Auth error');
            var resData = { };
            for(i = 0; i < returnFields.length; i++) {
                resData[returnFields[i]] = data[returnFields[i]];
            }
            storeRefreshToken(user._id, tokenSet.refreshToken, 'Local', false, function(error, data) {
                if(error || !data) return response.status(401).json('Login error');
                return response.status(200).json({ data: resData, tokens: tokenSet });
            });
        });
    });
}

function authenticateCredentials(credentials, usernameRequired, connection, cb) {
    if(!credentials.password) return cb('Password required');
    if(usernameRequired && !credentials.username) return cb('Username required');
    if(!usernameRequired && !credentials.email) return cb('Email required');

    var query = { connection: connection };

    if(usernameRequired) {
        query.username = credentials.username
    } else {
        query.email = credentials.email
    }

    LocalUser.findOne(query, function(error, user) {
        if(error) return cb('Authentication Error');
        if(!user) return cb('User does not exist');
        user.passwordMatch(credentials.password, function(error, isMatch) {
            if(error) return cb(error);
            if(!isMatch) return cb('Wrong password');
            return cb(null, user);
        });
    });

}

function insertUser(user, connection, usernameRequired, cb){
    if(!user || !connection || !user.email || !user.password || (usernameRequired && !user.username)) {
        return cb('Invalid credentials', null);
    }
    bcrypt.hash(user.password, 10, function(error, hash) {
        if(error || !hash) return cb(error);
        var newUser = new LocalUser({ email: user.email, passwordHash: hash, connection: connection });
        if(usernameRequired) newUser.username = user.username;
        return newUser.save(cb);
    });
}

function issueAccessToken(user, isSocial) {
    var payload = {
        _id: user._id,
        email: user.email,
        connection: user.connection,
        isSocial: isSocial
    };
    if(user.username) payload.username = user.username;
    var options = {
        expiresIn: 900,
        issuer: config.issuer
    };
    var token = jwt.sign(payload, config.jwtSecret, options);
    return token;
}

function storeRefreshToken(userId, token, provider, isSocial, cb) {
    var refresh = new RefreshToken();
    refresh.token = token;
    refresh.userId = userId;
    refresh.provider = provider;
    refresh.isSocial = isSocial;
    refresh.save(cb);
}

module.exports = router;
