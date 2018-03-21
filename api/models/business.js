var mongoose  = require('mongoose');
var shortId   = require('shortid');
var validator = require('email-validator');
var Schema    = mongoose.Schema;

var BranchSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return validator.validate(v);
            },
            message: '{VALUE} is not a valid email!'
        },
    },
},
{
    timestamps: true
});

var BusinessSchema = new Schema({
    shortId: {type: String, unique: true, default: shortId.generate},
    name: { type: String, required: true },
    logo: String,
    identities: [{
        userId: { type: String, required: true },
        provider: { type: String, required: true, enum: ['Local', 'Facebook', 'Google'] },
        isSocial: { type: Boolean, required: true }
    }],
    subscription: {
        subscriptionId: { type: String, required: true },
        active: { type: Boolean, required: true },
        lastPayment: Date,
        paidDays: Number,
    },
    basicData: {
        country: { type: String, required: true },
        city: { type: String, required: true },
        idNumber: { type: String, required: true },
        address: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        mapLocation: {
            lat: Number,
            long: Number
        }
    },
    contactData: {
        name: { type: String, required: true },
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
        phoneNumber: { type: String, required: true },
    },
    internetData: {
        website: String,
        facebookUser: String,
        instagramUser: String
    },
    branches: [BranchSchema],
    coupons: [{ couponId: String }]
},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

BusinessSchema.virtual('plan', {
    ref: 'Subscription',
    localField: 'subscription.subscriptionId',
    foreignField: 'shortId',
    justOne: true
});

BusinessSchema.virtual('couponsList', {
    ref: 'Coupon',
    localField: 'coupons.couponId',
    foreignField: 'shortId',
    justOne: true
});

module.exports = mongoose.model('Business', BusinessSchema);
