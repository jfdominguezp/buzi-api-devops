const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const BusinessCustomer = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    totalSpending: { type: String, required: true },
    availableSpending: { type: String, required: true }
}, 
{
    timestamps: true
});

module.exports = mongoose.model('BusinessCustomer', BusinessCustomer);