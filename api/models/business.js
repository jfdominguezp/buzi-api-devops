const mongoose  = require('mongoose');
const validator = require('email-validator');
const Schema    = mongoose.Schema;

const BranchSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    location: { type: String, coordinates: [Number] },
    country: { type: String, required: true },
    city: { type: String, required: true },
    email: {
        type: String,
        trim: true,
        validate: {
            validator: v => validator.validate(v),
            message: '{VALUE} is not a valid email!'
        },
    },
},
{
    timestamps: true
});

const BusinessSchema = new Schema({
    name: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    logo: String,
    displayImage: String,
    contactData: {
        name: { type: String, required: true },
        email: {
            type: String,
            trim: true,
            required: true,
            validate: {
                validator: v => validator.validate(v),
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
    identities: [{
        userId: { type: String, required: true },
        provider: { type: String, required: true, enum: ['Local', 'Facebook', 'Google'] },
        isSocial: { type: Boolean, required: true }
    }],
    branches: [BranchSchema],
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
