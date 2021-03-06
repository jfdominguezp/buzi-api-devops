const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

/*
*   Accounts will be linked in this Schema
*/
const MemberSchema = new Schema({
    name: { type: String, trim: true, required: true },
    familyName: { type: String, trim: true, required: true },
    identities: [{
        userId: { type: String, required: true },
        provider: { type: String, required: true, enum: ['Local', 'Facebook', 'Google'] },
        isSocial: { type: Boolean, required: true }
    }]
},
{
    timestamps: true
});

MemberSchema.query.byUserId = function(userId) {
    return this.where({ identities: { $elemMatch: { userId } } });
}

module.exports = mongoose.model('Member', MemberSchema);
