const mongoose    = require('mongoose');
const Transaction = require('./transaction');
const Schema      = mongoose.Schema;

const SpendingTransaction = new Schema({
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Credit', 'Debit'] }
},
{
    timestamps: true
})

Transaction.discriminator('SpendingTransaction', SpendingTransaction);

module.export = mongoose.model('SpendingTransaction');