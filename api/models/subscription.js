const shortId  = require('shortid');
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const SubscriptionSchema = new Schema({
    shortId: { type: String, unique: true, default: shortId.generate },
    name: { type: String, required: true },
    maxActiveCoupons: { type: Number, required: true },
    mainPage: { type: Boolean, required: true },
    priority: { type: Number, required: true },
    cycleDays: { type: Number, required: true },
    benefits: [{
        code: { type: String, required: true },
        description: { type: String, required: true },
        quantity: { type: String, required: true }
    }],
    offers: [{
        newPrice: { type: Number, required: true },
        startDate: { type: Date, required: true },
        finalDate: { type: Date, required: true }
    }]
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);
