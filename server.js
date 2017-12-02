//Packages
var express    = require('express');
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var cors       = require('cors');

//Routes
var businessRoutes = require('./api/routes/business-routes');
var couponRoutes = require('./api/routes/coupon-routes');
var subscriptionRoutes = require('./api/routes/subscription-routes');
var testRoutes = require('./api/routes/test-routes');

//Config
var config = require('./config/server-config');

//App
var port = process.env.PORT;
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
router.use('/coupon', couponRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/test', testRoutes);

/*
var whitelist = ['https://mistercupon.co', 'https://www.mistercupon.co', 'https://mrcupon.co', 'https://www.mrcupon.co', 'http://localhost:4200']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}*/

app.use(cors());

function checkHTTPS(request, response, next){
  if (!request.get('x-arr-ssl')){
    return response.status(401).json('HTTPS required');
  }
  next();
}

if(app.settings.env !== 'development'){
  app.use(checkHTTPS);
}

app.use('/api', router);


app.listen(port);
console.log('Magic happens on port ' + port);

module.exports = app;
