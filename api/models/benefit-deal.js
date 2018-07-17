const mongoose = require('mongoose');
const Benefit = require('./benefit');
const Schema = mongoose.Schema;

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

//TODO Search deals by location
const Deal = Benefit.discriminator('Deal', new Schema({
    startDate: { type: Date, default: Date.now() },
    endDate: { type: Date },
    scheduledDays: [{
        dayOfWeek: { type: String, enum: daysOfWeek, required: true },
        startingHour: { type: Number, min: 0, max: 23 },
        startingMinute: { type: Number, min: 0, max: 59 },
        endingHour: { type: Number, min: 0, max: 23 },
        endingMinute: { type: Number, min: 0, max: 59 }
    }],
},
{
    timestamps: true
}));

module.exports = mongoose.model('Deal');