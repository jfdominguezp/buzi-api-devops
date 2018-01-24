var express   = require('express');
var jwt       = require('jsonwebtoken');
var LocalUser = require('../models/local-user');
var config    = require('../../config/server-config').authConfig;
var router    = express.Router();

router.post('/login', login).post('/token', token);


function login(request, response) {
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

        var payload = {
            _id: user._id,
            email: user.email,
            connection: user.connection
        };

        var options = {
            expiresIn: 900,
            issuer: config.issuer
        };

        var token = jwt.sign(payload, config.jwtSecret, options);
        var refresh = jwt.sign({ _id: user._id }, config.refreshSecret, { issuer: config.issuer });
        return res.status(200).json({ accessToken: token, refreshToken: refresh });
    });
}

function token(request, response) {
    var userId = request.body._id;
    var refresh = request.body.refreshToken;

    if(!userId || !refresh) return response.status(400).json('Bad Request');
    jwt.verify(refresh, config.refreshSecret, { issuer: config.issuer }, function(error, decoded) {
        if(error || !decoded || !decoded._id) return response.status(401).json('Bad refresh token');
        if(decoded._id != userId) return response.status(401).json('Unauthorized');

        var refresh = jwt.sign({ _id: user._id }, config.refreshSecret, { issuer: config.issuer });
        return res.status(200).json({ _id: userId, refreshToken: refresh });
    });
}


module.exports = router;
