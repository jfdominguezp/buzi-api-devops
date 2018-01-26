//Packages
var express            = require('express');
var bodyParser         = require('body-parser');
var mongoose           = require('mongoose');
var cors               = require('cors');
var Raven              = require('raven');
var morgan             = require('morgan');

//Routes
var businessRoutes     = require('./api/routes/business-routes');
var leadRoutes         = require('./api/routes/lead-routes');
var couponRoutes       = require('./api/routes/coupon-routes');
var subscriptionRoutes = require('./api/routes/subscription-routes');
var testRoutes         = require('./api/routes/test-routes');
var mailRoutes         = require('./api/routes/mail-routes');
var authRoutes         = require('./api/routes/auth-routes');
var memberRoutes       = require('./api/routes/member-routes');

//Config
var config             = require('./config/server-config');

//App
var port     = process.env.PORT || 80;
var app        = express();
var router = express.Router();

//Configure Raven
Raven.config('https://b60807bc8af9464887923d18185963a2:ab5e268daa0b47ed8cf91e3ce55cf83e@sentry.io/259670').install();
app.use(Raven.requestHandler());


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
router.use('/leads', leadRoutes);
router.use('/mail', mailRoutes);
router.use('/auth', authRoutes);
router.use('/member', memberRoutes);


app.use(morgan('dev'));

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

app.use(Raven.errorHandler());
app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + '\n');
});


app.listen(port);
console.log('Magic happens on port ' + port);

module.exports = app;
