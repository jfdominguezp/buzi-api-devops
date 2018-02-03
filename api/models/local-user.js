var mongoose = require('mongoose');
var bcrypt   = require('bcrypt');
var Schema   = mongoose.Schema;

var LocalUserSchema = new Schema({
    connection: { type: String, required: true, enum: ['People', 'Businesses', 'Administrators'] },
    email: { type: String, trim: true, required: true },
    email_verified: { type: Boolean, default: false },
    username: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String }
},
{
    timestamps: true
});

LocalUserSchema.index({ email: 1, connection: 1 }, { unique: true });

LocalUserSchema.methods.passwordMatch = function(password, cb) {
    bcrypt.compare(password, this.passwordHash, function(error, isMatch) {
        if(error) return cb(error);
        return cb(null, isMatch);
    });
}

module.exports = mongoose.model('LocalUser', LocalUserSchema);
