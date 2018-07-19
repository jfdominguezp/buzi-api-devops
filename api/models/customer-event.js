const _            = require('lodash');
const mongoose     = require('mongoose');
const randomString = require('randomstring');
const Schema       = mongoose.Schema;

//Statuses: Claimed, Used
const CustomerEvent = new Schema({
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    benefitId: { type: Schema.Types.ObjectId, ref: 'Benefit', required: true },
    code: { type: String, required: true },
    updates: [{
        date: { type: Date, default: Date.now() },
        CustomerEvent: { type: String, required: true }
    }]
},
{
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

CustomerEvent.index({ benefitId: 1, code: 1 }, { unique: true });

//TODO Create CustomerEvent
//TODO Update CustomerEvent CustomerEvent
//TODO Get CustomerEvent status by benefit and member




//Static Methods

CustomerEvent.statics.createCustomerEvent = function (couponId, businessId, memberId, maxCustomerEvents, CustomerEventTimes, cb) {
    const CouponCustomerEvent = mongoose.model('CouponCustomerEvent', CustomerEvent);
    this.where({ couponId }).count((error, count) => {
        if (error) return cb(error);
        if (count >= maxCustomerEvents) return cb('Max CustomerEvents reached');
        this.find({ couponId, memberId }, (error, CustomerEvents) => {
            if (error) return cb(error);
            if (CustomerEvents.length >= CustomerEventTimes) return cb("Member can not CustomerEvent this coupon");
            let couponCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
            while(_.find(CustomerEvents, { couponCode })){
                couponCode = randomString.generate({ length: 5, capitalization: 'uppercase' });
            }
            const newCustomerEvent = new CouponCustomerEvent({ 
                businessId,
                memberId,
                couponId,
                couponCode,
                CustomerEvents: [{ CustomerEvent: 'CustomerEvent' }]  
            });
            newCustomerEvent.save(cb);
        });
    });
};

//TODO Refactor from here
CustomerEvent.statics.getCustomerEventsByMember = function (memberId, cb) {
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
        .exec((error, CustomerEvents) => {
            if(error) return cb(error);
            return cb(null, CustomerEvents);
        });
};

CustomerEvent.statics.useCoupon = function (couponId, businessId, couponCode, cb) {
    this.findOne({ couponId, businessId, couponCode }, (error, CustomerEvent) => {
        if(error) return cb(error);
        if(!CustomerEvent) return cb('CustomerEvent does not exist');
        if(_.find(CustomerEvent.CustomerEvents, { CustomerEvent: 'Use' })) return cb('Coupon already used');
        CustomerEvent.CustomerEvents.push({ CustomerEvent: 'Use' });
        return CustomerEvent.save(cb);
    });
}

module.exports = mongoose.model('CustomerEvent', CustomerEvent);
