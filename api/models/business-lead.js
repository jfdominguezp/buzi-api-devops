const mongoose     = require('mongoose');
const shortId      = require('shortid');
const validator    = require('email-validator');
const Schema       = mongoose.Schema;

const BusinessLeadSchema = new Schema({
    shortId: { type: String, unique: true, default: shortId.generate },
    name: { type: String,    required: true },
    business: { type: String, required: true },
    phone: { type: String, required: true, minlength: 7, maxlength: 10 },
    email: {
        type: String,
        required: true,
        validate: {
            validator: v => validator.validate(v),
            message: '{VALUE} is not a valid email!'
        },
    },
    city: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

BusinessLeadSchema.index({ email: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('BusinessLead', BusinessLeadSchema);
