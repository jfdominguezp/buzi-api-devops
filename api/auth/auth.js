const passport    = require('passport');
const config      = require('../../config/server-config');
const LocalUser   = require('../models/local-user');
const Member      = require('../models/member');
const Business    = require('../models/business');

//JWT Strategy Variables
const passportJwt = require('passport-jwt');
const ExtractJwt  = passportJwt.ExtractJwt;
const JwtStrategy = passportJwt.Strategy;
const jwtParams   = {
    secretOrKey: config.authConfig.jwtSecret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    issuer: config.authConfig.issuer
};

//JWT Local Strategy
const jwtMembersLocal = new JwtStrategy(jwtParams, (jwt_payload, done) => {
    LocalUser.findOne({ _id: jwt_payload._id, connection: 'People' }, (error, user) => {
        if(error) return done(error, null);
        if(!user) return done(null, null);
        Member.findOne({ 'identities.userId': user._id, 'identities.provider': 'Local' }, (error, member) => {
            if(error) return done(error, null);
            if(!member) return done(null, null);

            const { _id, name, familyName, claimTimes } = member;

            const memberData = {
                name,
                familyName,
                claimTimes,
                memberId: _id,
                email: user.email,
                userId: user._id
            };
            return done(null, memberData);
        });
    });
});

const jwtBusinessesLocal = new JwtStrategy(jwtParams, (jwt_payload, done) => {
    LocalUser.findOne({ _id: jwt_payload._id, connection: 'Businesses' }, function(error, user) {
        if(error) return done(error, null);
        if(!user) return done(null, null);
        Business.findOne(
            { 'identities.userId': user._id, 'identities.provider': 'Local' }, 
            'shortId name logo userId -_id',  
            (error, business) => {
            if(error) return done(error, null);
            if(!business) return done(null, null);

            return done(null, business);
        });
    });
});

// const jwtAdminLocal = new JwtStrategy(jwtParams, (jwt_payload, done) => {
//     findLocalUser(jwt_payload, 'Administrators', done);
// });

passport.use('members', jwtMembersLocal);
passport.use('businesses', jwtBusinessesLocal);
//passport.use('administrators', jwtAdminLocal);


//Ownership Verification
function verifyMemberOwnership(request, response, next) {
    const user = request.user;
    const memberId = request.body.memberId;
    if(!memberId) return response.status(400).json('Bad Request');
    if(memberId != user.memberId) return response.status(401).json('Unauthorized');
    return next();
}

const actions = {
    authenticateMember: () => {
        return passport.authenticate('members', { session: false });
    },
    authenticateBusiness: () => {
        return passport.authenticate('businesses', { session: false });
    },
    authenticateAdministrator: () => {
        return passport.authenticate('administrators', { session: false });
    },
    verifyMemberOwnership: verifyMemberOwnership
};

module.exports = actions;
