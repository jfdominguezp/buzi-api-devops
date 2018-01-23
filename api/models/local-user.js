var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LocalUserSchema = new Schema({
    connection: { type: String, required: true, enum: ['People', 'Businesses', 'Administrators'] },
    email: { type: String, trim: true, unique: true, required: true },
    email_verified: { type: Boolean, default: false },
    username: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String }
},
{
    timestamps: true
});

module.exports = mongoose.model('LocalUser', LocalUserSchema);
