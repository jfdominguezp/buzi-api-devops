var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var businessSchema = new Schema(
  {
    name: String,
    user: String,
    hasBranches: Boolean,
    subscription: {
      subscriptionId: String,
      active: Boolean
    },
    basicData: {
      country: String,
      city: String,
      idNumber: String,
      address: String,
      phoneNumber: String,
      mapLocation: {
        lat: Number,
        long: Number
      }
    },
    contactData: {
      name: String,
      email: String,
      phoneNumber: String,
    },
    internetData: {
      website: String,
      facebookUser: String,
      intagramUser: String
    },
    branches: [{
      name: String,
      address: String,
      phoneNumber: String,
      email: String
    }]
    coupons: [{
      couponId: String
    }]

  }
);

var Business = mongoose.model('Business', businessSchema);
