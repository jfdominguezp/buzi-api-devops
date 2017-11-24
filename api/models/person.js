var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var personSchema = new Schema({
  clientId: String
});

var Branch = mongoose.model('Person', personSchema);
