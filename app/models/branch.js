var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var branchSchema = new Schema({
  name: String,
  address: String,
  phoneNumber: String,
  email: String
});

var Branch = mongoose.model('Branch', branchSchema);
