var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  client_id: String,
});

var Branch = mongoose.model('User', userSchema);
