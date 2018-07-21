const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const Benefit = new Schema({
    businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    termsAndConditions: { type: String },
    image: { type: String },
    branches: { type: [String] }
}, 
{
    timestamps: true,
    discriminatorKey: 'kind'
});

module.exports = mongoose.model('Benefit', Benefit);