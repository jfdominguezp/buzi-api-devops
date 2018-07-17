const mongoose    = require('mongoose');
const Transaction = require('./transaction');
const Schema      = mongoose.Schema;

const SpendingTransaction = Transaction.discriminator('SpendingTransaction', new Schema({
    amount: { type: Number, required: true }
},
{
    timestamps: true
}));

module.export = mongoose.model('SpendingTransaction');