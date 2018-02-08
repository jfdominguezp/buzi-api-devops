var mongoose  = require('mongoose');
var bcrypt    = require('bcrypt');
var validator = require('email-validator');
var Schema    = mongoose.Schema;

var LocalUserSchema = new Schema({
    connection: { type: String, required: true, enum: ['People', 'Businesses', 'Administrators'] },
    email: {
        type: String,
        trim: true,
        required: true,
        validate: {
            validator: function(v) {
                return validator.validate(v);
            },
            message: '{VALUE} is not a valid email!'
        },
    },
    email_verified: { type: Boolean, default: false },
    username: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String }
},
{
    timestamps: true
});

LocalUserSchema.index({ email: 1, connection: 1 }, { unique: true });

LocalUserSchema.methods.passwordMatch = function(password, cb) {
    bcrypt.compare(password, this.passwordHash, function(error, isMatch) {
        if(error) return cb(error);
        return cb(null, isMatch);
    });
}

LocalUserSchema.statics.changePassword = function(connection, userId, password, cb) {
    this.findOne({ _id: userId, connection: connection }, function(error, user) {
        if(error) return cb(error);
        if(!user) return cb('User does not exist');

        bcrypt.hash(password, 10, function(error, hash) {
            if(error || !hash) return cb('Error');
            user.passwordHash = hash;
            user.save(cb);
        });
    });
}

LocalUserSchema.statics.markEmailVerified = function(userId, cb) {
    this.findOne({ _id: userId }, function(error, user) {
        if(error) return cb(error);
        if(!user) return cb('User does not exist');
        user.email_verified = true;
        user.save(cb);
    });
}

module.exports = mongoose.model('LocalUser', LocalUserSchema);
