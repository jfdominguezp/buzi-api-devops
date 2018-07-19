const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const Transaction = new Schema({
    businessId: { type: String, required: true },
    memberId: { type: String, required: true },
}, 
{
    timestamps: true,
    discriminatorKey: 'kind' 
});

module.exports = mongoose.model('Transaction', Transaction);