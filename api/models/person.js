var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var personSchema = new Schema({
  clientId: String,
  claims: [{
    couponId: String,
    code: String
  }]
});

var Branch = mongoose.model('Person', personSchema);
