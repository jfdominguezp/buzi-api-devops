var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

/*
*   Accounts will be linked in this Schema
*/
var AdministratorSchema = new Schema({
    name: { type: String, trim: true, required: true },
    family_name: { type: String, trim: true, required: true },
    identities: [{
        user_id: { type: String, required: true },
        provider: { type: String, required: true, enum: ['Local', 'Facebook', 'Google'] },
        isSocial: { type: Boolean, required: true }
    }]
},
{
    timestamps: true
});

module.exports = mongoose.model('Administrator', AdministratorSchema);
