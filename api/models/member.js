var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

/*
*   Accounts will be linked in this Schema
*/
var MemberSchema = new Schema({
    name: { type: String, trim: true, required: true },
    familyName: { type: String, trim: true, required: true },
    claimTimes: { type: Number, default: 1 },
    identities: [{
        userId: { type: String, required: true },
        provider: { type: String, required: true, enum: ['Local', 'Facebook', 'Google'] },
        isSocial: { type: Boolean, required: true }
    }]
},
{
    timestamps: true
});

module.exports = mongoose.model('Member', MemberSchema);
