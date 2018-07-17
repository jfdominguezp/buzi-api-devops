require('dotenv').config();

//Packages
const express    = require('express');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const cors       = require('cors');
const Raven      = require('raven');
const morgan     = require('morgan');

//Middlewares
const handleErrors   = require('./api/errors/error-handlers');

//Routes
const benefitRoutes  = require('./api/routes/benefit-routes');
const businessRoutes = require('./api/routes/business-routes');
const authRoutes     = require('./api/routes/auth/index');
const memberRoutes   = require('./api/routes/member-routes');

//Config
const config = require('./config/server-config');

//App
const port     = process.env.PORT || 3000;
const app      = express();
const router   = express.Router();

//Configure Raven
Raven.config('https://1bda48c3836d44df8bc374b629d4c296:503d8785a786416abc68627fe20807af@sentry.io/306530').install();
app.use(Raven.requestHandler());


mongoose.connect(config.mongoURI[app.settings.env], (err, res) => {
    if(err) {
        console.log('Error connecting to the database. ' + err);
    } else {
        console.log('Connected to Database: ' + config.mongoURI[app.settings.env]);
    }
}, { useNewUrlParser: true });

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.use('/benefits', benefitRoutes);
router.use('/business', businessRoutes);
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

if(app.settings.env === 'production'){
    app.use(checkHTTPS);
}

app.use('/api', router);

app.use(handleErrors);
app.use(Raven.errorHandler());
app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    console.log(err);
    res.end(res.sentry + '\n');
});


app.listen(port);
console.log('Magic happens on port ' + port);

module.exports = app;
