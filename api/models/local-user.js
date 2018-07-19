const mongoose        = require('mongoose');
const bcrypt          = require('bcrypt');
const validator       = require('email-validator');
const { createError } = require('../errors/error-generator');
const { NOT_FOUND }   = require('../errors/error-types').general;
const Schema          = mongoose.Schema;

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

LocalUserSchema.methods.passwordMatch = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
}

LocalUserSchema.statics.changePassword = async function (_id, connection, password) {
    const user = await this.findOne({ _id, connection });
    if(!user) throw createError(NOT_FOUND, 'User does not exist');
    const hash = await bcrypt.hash(password, 10);
    user.passwordHash = hash;
    return user.save();
}

LocalUserSchema.statics.markEmailVerified = async function (_id) {
    const user = await this.findOne({ _id });
    if(!user) throw createError(NOT_FOUND, 'User does not exist');
    if(user.email_verified) return user;
    user.email_verified = true;
    user.save();
}

module.exports = mongoose.model('LocalUser', LocalUserSchema);
