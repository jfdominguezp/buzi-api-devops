var passport    = require('passport');
var config      = require('../../config/server-config');
var LocalUser   = require('../models/local-user');
var SocialUser  = require('../models/social-user');
var Member      = require('../models/member');

//JWT Strategy Variables
var passportJwt = require('passport-jwt');
var ExtractJwt  = passportJwt.ExtractJwt;
var JwtStrategy = passportJwt.Strategy;
var jwtParams   = {
    secretOrKey: config.authConfig.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    issuer: config.authConfig.issuer
};

//JWT Local Strategy
function findLocalUser(jwt_payload, connection, done) {
    LocalUser.findOne({ _id: jwt_payload._id, connection: connection }, function(error, user) {
        if(error) return done(error, false);
        if(!user) return done(null, false);
        return done(null, { _id: user._id, email: user.email, connection: user.connection });
    });
}

var jwtMembersLocal = new JwtStrategy(jwtParams, function(jwt_payload, done) {
    LocalUser.findOne({ _id: jwt_payload._id, connection: 'People' }, function(error, user) {
        if(error) return done(error, false);
        if(!user) return done(null, false);
        Member.findOne({ 'identities.userId': user._id, 'identities.provider': 'Local' }, function(error, member) {
            if(error) return done(error, false);
            if(!member) return done(null, false);

            var memberData = {
                memberId: member._id,
                name: member.name,
                familyName: member.familyName,
                email: member.email,
                claimTimes: member.claimTimes,
                userId: user._id
            };
            return done(null, memberData);
        });
    });
});

var jwtBusinessesLocal = new JwtStrategy(jwtParams, function(jwt_payload, done) {
    findLocalUser(jwt_payload, 'Businesses', done);
});

var jwtAdminLocal = new JwtStrategy(jwtParams, function(jwt_payload, done) {
    findLocalUser(jwt_payload, 'Administrators', done);
});

passport.use('members', jwtMembersLocal);
passport.use('businesses', jwtBusinessesLocal);
passport.use('administrators', jwtAdminLocal);


//Ownership Verification
function verifyMemberOwnership(request, response, next) {
    var user = request.user;
    var memberId = request.body.memberId;
    if(!memberId) return response.status(400).json('Bad Request');
    if(memberId != user.memberId) return response.status(401).json('Unauthorized');
    return next();
}

var actions = {
    authenticateMember: function() {
        return passport.authenticate('members', { session: false });
    },
    authenticateBusiness: function() {
        return passport.authenticate('businesses', { session: false });
    },
    authenticateAdministrators: function() {
        return passport.authenticate('administrators', { session: false });
    },
    verifyMemberOwnership: verifyMemberOwnership
};

module.exports = actions;
