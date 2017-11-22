var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BranchSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true }
});

var BusinessSchema = new Schema(
  {
    name: { type: String, required: true },
    clientId: { type: String, required: true },
    subscription: {
      subscriptionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      active: { type: Boolean, required: true }
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
    coupons: [mongoose.Schema.Types.ObjectId]

  }
);

module.exports = mongoose.model('Business', BusinessSchema);
