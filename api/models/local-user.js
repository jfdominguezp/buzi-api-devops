const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const validator = require('email-validator');
const Schema    = mongoose.Schema;

const LocalUserSchema = new Schema({
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

LocalUserSchema.methods.passwordMatch = (password, cb) => {
    bcrypt.compare(password, this.passwordHash, (error, isMatch) => {
        if(error) return cb(error);
        return cb(null, isMatch);
    });
}

LocalUserSchema.statics.changePassword = (_id, connection, password, cb) => {
    this.findOne({ _id, connection }, (error, user) => {
        if(error) return cb(error);
        if(!user) return cb('User does not exist');

        bcrypt.hash(password, 10, (error, hash) => {
            if(error || !hash) return cb('Error');
            user.passwordHash = hash;
            user.save(cb);
        });
    });
}

LocalUserSchema.statics.markEmailVerified = (_id, cb) => {
    this.findOne({ _id }, function(error, user) {
        if(error) return cb(error);
        if(!user) return cb('User does not exist');
        if(user.email_verified) return cb('Email already verified');
        user.email_verified = true;
        user.save(cb);
    });
}

module.exports = mongoose.model('LocalUser', LocalUserSchema);
