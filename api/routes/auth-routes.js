var express      = require('express');
var jwt          = require('jsonwebtoken');
var randtoken    = require('rand-token');
var bcrypt       = require('bcrypt');
var LocalUser    = require('../models/local-user');
var RefreshToken = require('../models/refresh-token');
var Member       = require('../models/member');
var config       = require('../../config/server-config').authConfig;
var router       = express.Router();

router.post('/login', memberLogin).post('/token', token).post('/signup', memberSignup);

//POST Functions
function memberLogin(request, response) {
    if(!request.body.password || (!request.body.email && !request.body.username)) {
        return response.status(400).json('Incomplete credentials');
    }

    var query = { };

    if(request.body.username) {
        query['username'] = request.body.username;
    } else {
        query['email'] = request.body.email;
    }

    LocalUser.findOne(query, function(error, user){
        if(error) return response.status(401).json('Authentication Error');
        if(!user) return response.status(404).json('User does not exist');
        var tokenSet = { accessToken: issueAccessToken(user, false), refreshToken: randtoken.generate(16) };
        Member.findOne({ 'identities.userId': user._id, 'identities.provider': 'Local' }, function(error, member) {
            if(error || !member) return response.status(401).json('Auth error');
            var newMember = { memberId: member._id, name: member.name, familyName: member.familyName };
            storeRefreshToken(user._id, tokenSet.refreshToken, 'Local', false, function(error, data) {
                if(error || !data) return response.status(401).json('Auth error');
                return response.status(200).json({ member: newMember, tokens: tokenSet });
            });
        });
    });
}

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

function memberSignup(request, response) {
    var user = request.body;
    if(!user || !user.name || !user.familyName || !user.email) {
        return response.status(400).json('Incomplete profile');
    }
    insertUser(user, 'People', function(error, localUser) {
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


//Utility Functions
function insertUser(user, connection, cb){
    if(!user || !connection || !user.email || !user.password || (connection !== 'People' && !user.username)) {
        return cb('Invalid credentials', null);
    }
    bcrypt.hash(user.password, 10, function(error, hash) {
        if(error || !hash) return cb(error);
        var newUser = new LocalUser({ email: user.email, passwordHash: hash, connection: connection });
        if(connection !== 'People') newUser.username = user.username;
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
