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
const rewardsRoutes  = require('./api/routes/benefits/rewards.routes');
const dealsRoutes    = require('./api/routes/benefits/deals.routes');
const businessRoutes = require('./api/routes/businesses/businesses.routes');
const authRoutes     = require('./api/routes/auth/auth.routes');
const memberRoutes   = require('./api/routes/member-routes');

//Config
const config   = require('./config/server-config');

//App
const port     = process.env.PORT || 3000;
const app      = express();
const router   = express.Router();

//Configure Raven
Raven.config(config.thirdParty.sentryUri).install();
app.use(Raven.requestHandler());


mongoose.connect(config.mongoURI[app.settings.env], (err, res) => {
    if(err) {
        console.log('Error connecting to the database. ' + err);
    } else if(app.settings.env !== 'test') {
        console.log('Connected to Database: ' + config.mongoURI[app.settings.env]);
    }
}, { useNewUrlParser: true });

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.use('/rewards', rewardsRoutes);
router.use('/deals', dealsRoutes);
router.use('/businesses', businessRoutes);
router.use('/auth', authRoutes);
router.use('/member', memberRoutes);

if (app.settings.env === 'development') {
    app.use(morgan('dev'));
}

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
    res.end(res.sentry + '\n');
});


app.listen(port);

if(app.settings.env !== 'test'){
    console.log('Magic happens on port ' + port);
}

module.exports = app;
