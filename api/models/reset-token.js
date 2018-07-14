const mongoose  = require('mongoose');
const randtoken = require('rand-token');
const Schema    = mongoose.Schema;

const ResetTokenSchema = new Schema({
    token: { type: String, required: true },
    userId: { type: String, required: true },
    used: { type: Boolean, default: false }
},
{
    timestamps: true
});

ResetTokenSchema.index({ createdAt: 1 }, { expires: '1h' });
ResetTokenSchema.index({ userId: 1, token: 1 }, { unique: true });

ResetTokenSchema.statics.generateToken = (userId, cb) => {

    this.findOne({ userId, used: false }, (error, token) => {
        if(error) return cb(error);
        if(token) return cb(null, token);

        const ResetToken = mongoose.model('ResetToken', ResetTokenSchema);
        const newToken = new ResetToken({
            userId,
            token: randtoken.generate(24)
        });
        newToken.save(cb);
    });
}

ResetTokenSchema.statics.useToken = (userId, token, cb) => {
    this.findOne({ userId, token }, (error, token) => {
        if(error) return cb(error);
        if(!token) return cb('Invalid id or token');
        if(token.used) return cb('Token used');
        token.used = true;
        return token.save(cb);
    });
}

module.exports = mongoose.model('ResetToken', ResetTokenSchema);
