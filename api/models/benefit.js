const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const options = { discriminatorKey: 'kind' };


const Benefit = new Schema({
    businessId: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    termsAndConditions: { type: String },
    image: { type: String },
    branches: { type: [String] }
}, options);

Benefit.virtual('business', {
    ref: 'Business',
    localField: 'businessId',
    foreignField: '_id',
    justOne: true
});

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

//TODO Search deals by location
const Deal = new Schema({
    startDate: { type: Date, default: Date.now() },
    endDate: { type: Date },
    scheduledDays: [{
        dayOfWeek: { type: String, enum: daysOfWeek, required: true },
        startingHour: { type: Number, min: 0, max: 23 },
        startingMinute: { type: Number, min: 0, max: 59 },
        endingHour: { type: Number, min: 0, max: 23 },
        endingMinute: { type: Number, min: 0, max: 59 }
    }]
});

module.exports = mongoose.model('Benefit', Benefit);