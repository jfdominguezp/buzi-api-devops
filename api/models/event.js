const _            = require('lodash');
const mongoose     = require('mongoose');
const randomString = require('randomstring');
const Schema       = mongoose.Schema;

//Statuses: Claimed, Used
const Event = new Schema({
    businessId: { type: String,  required: true },
    memberId: { type: String, required: true },
    benefitId: { type: String, required: true },
    code: { type: String, required: true },
    updates: [{
        date: { type: Date, default: Date.now() },
        event: { type: String, required: true }
    }]
},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

Event.index({ benefitId: 1, code: 1 }, { unique: true });

Event.virtual('benefit', {
    ref: 'Benefit',
    localField: 'benefitId',
    foreignField: '_id',
    justOne: true
});

Event.virtual('business', {
    ref: 'Business',
    localField: 'businessId',
    foreignField: '_id',
    justOne: true
});

//TODO Create Event
//TODO Update Event Event
//TODO Get Event status by benefit and member




//Static Methods

Event.statics.createEvent = (couponId, businessId, memberId, maxEvents, EventTimes, cb) => {
    const CouponEvent = mongoose.model('CouponEvent', Event);
    this.where({ couponId }).count((error, count) => {
        if (error) return cb(error);
        if (count >= maxEvents) return cb('Max Events reached');
        this.find({ couponId, memberId }, (error, Events) => {
            if (error) return cb(error);
            if (Events.length >= EventTimes) return cb("Member can not Event this coupon");
            let couponCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
            while(_.find(Events, { couponCode })){
                couponCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
            }
            const newEvent = new CouponEvent({ 
                businessId,
                memberId,
                couponId,
                couponCode,
                Events: [{ Event: 'Event' }]  
            });
            newEvent.save(cb);
        });
    });
};

//TODO Refactor from here
Event.statics.getEventsByMember = (memberId, cb) => {
    const populate = [
        {
            path: 'coupon',
            model: 'Coupon',
            select: 'shortId businessId name category productImages initialDate finalDate'
        },
        {
            path: 'business',
            model: 'Business',
            select: 'shortId name logo basicData.mapLocation'
        }
    ];

    this.find({ memberId })
        .sort({ createdAt: -1 })
        .populate(populate)
        .exec((error, Events) => {
            if(error) return cb(error);
            return cb(null, Events);
        });
};

Event.statics.useCoupon = (couponId, businessId, couponCode, cb) => {
    this.findOne({ couponId, businessId, couponCode }, (error, Event) => {
        if(error) return cb(error);
        if(!Event) return cb('Event does not exist');
        if(_.find(Event.Events, { Event: 'Use' })) return cb('Coupon already used');
        Event.Events.push({ Event: 'Use' });
        return Event.save(cb);
    });
}

module.exports = mongoose.model('Event', Event);
