//Packages
var express    = require('express');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');

//Routes
var businessRoutes = require('./api/routes/business-routes');

//Config
var config       = require('./config/server-config');

//App
var port = process.env.PORT || 8080;
var app = express();
var router = express.Router();

mongoose.connect(config.mongoURI[app.settings.env], {useMongoClient: true}, function(err, res) {
  if(err) {
    console.log('Error connecting to the database. ' + err);
  } else if(app.settings.env !== 'test')
    console.log('Connected to Database: ' + config.mongoURI[app.settings.env]);
});

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.use('/business', businessRoutes);

app.use('/api', router);

app.listen(port);
console.log('Magic happens on port ' + port);

module.exports = app;
