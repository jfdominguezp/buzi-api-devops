var mongoose = require('mongoose');
var shortId = require('shortid');
var Schema = mongoose.Schema;

var BranchSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true }
});

var BusinessSchema = new Schema(
  {
    shortId: {type: String, unique: true, default: shortId.generate},
    name: { type: String, required: true },
    clientId: { type: String, required: true },
    subscription: {
      subscriptionId: { type: String, required: true },
      active: { type: Boolean, required: true },
      lastPayment: Date,
      paidDays: Number,
    },
    basicData: {
      country: { type: String, required: true },
      city: { type: String, required: true },
      idNumber: { type: String, required: true },
      address: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      mapLocation: {
        lat: Number,
        long: Number
      }
    },
    contactData: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phoneNumber: { type: String, required: true },
    },
    internetData: {
      website: String,
      facebookUser: String,
      intagramUser: String
    },
    branches: [BranchSchema],
    coupons: [String]
  }
);

module.exports = mongoose.model('Business', BusinessSchema);
