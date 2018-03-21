var passport    = require('passport');
var config      = require('../../config/server-config');
var LocalUser   = require('../models/local-user');
var SocialUser  = require('../models/social-user');
var Member      = require('../models/member');
var Business    = require('../models/business');
var Coupon      = require('../models/coupon');

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
    LocalUser.findOne({ _id: jwt_payload._id, connection: 'Businesses' }, function(error, user) {
        if(error) return done(error, false);
        if(!user) return done(null, false);
        Business.findOne({ 'identities.userId': user._id, 'identities.provider': 'Local' }, 'shortId name logo userId -_id', function (error, business) {
            if(error) return done(error, false);
            if(!business) return done(null, false);

            return done(null, business);
        });
    });
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

function verifyCouponOwnership(request, response, next) {
    Coupon.findOne({ shortId: request.params.id }, function(error, coupon) {
        if(error) return response.status(500).json(error);
        if(!coupon) return response.status(404).json('Coupon not found');
        if(coupon.businessId != request.user.shortId) return response.status(403).json('Business does not own the specified coupon');
        return next();
    });
}

var actions = {
    authenticateMember: function() {
        return passport.authenticate('members', { session: false });
    },
    authenticateBusiness: function() {
        return passport.authenticate('businesses', { session: false });
    },
    authenticateAdministrator: function() {
        return passport.authenticate('administrators', { session: false });
    },
    verifyMemberOwnership: verifyMemberOwnership,
    verifyCouponOwnership: verifyCouponOwnership
};

module.exports = actions;
