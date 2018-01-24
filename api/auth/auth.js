var passport    = require('passport');
var config      = require('../../config/server-config');
var LocalUser   = require('../models/local-user');
var SocialUser  = require('../models/social-user');

//JWT Strategy Variables
var passportJwt = require('passport-jwt');
var ExtractJwt  = passportJwt.ExtractJwt;
var JwtStrategy = passportJwt.Strategy;
var jwtParams   = {
    secretOrKey: config.authConfig.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    issuer: config.authConfig.issuer
};

function findLocalUser(jwt_payload, connection, done) {
    LocalUser.findOne({ _id: jwt_payload._id, connection: connection }, function(error, user) {
        if(error) return done(error, false);
        if(user) return done(null, { _id: user._id, email: user.email, connection: user.connection });
        return done(null, false);
    });
}

var jwtMembersLocal = new JwtStrategy(jwtParams, function(jwt_payload, done) {
    findLocalUser(jwt_payload, 'People', done);
});

var jwtBusinessesLocal = new JwtStrategy(jwtParams, function(jwt_payload, done) {
    findLocalUser(jwt_payload, 'Businesses', done);
});

var jwtAdminLocal = new JwtStrategy(jwtParams, function(jwt_payload, done) {
    findLocalUser(jwt_payload, 'Administrators', done);
});

module.exports = function() {

    passport.use('members', jwtMembersLocal);
    passport.use('businesses', jwtBusinessesLocal);
    passport.use('administrators', jwtAdminLocal);

    return {
        authenticateMember: function() {
            return passport.authenticate('members', { session: false });
        },
        authenticateBusiness: function() {
            return passport.authenticate('businesses', { session: false });
        },
        authenticateAdministrators: function() {
            return passport.authenticate('administrators', { session: false });
        }
    }
};
