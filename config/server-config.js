var config = { };

config.mongoURI = Object.freeze({
    development: 'mongodb://api:*1426*agjmig2211*@cluster0-shard-00-00-m0khv.mongodb.net:27017,cluster0-shard-00-01-m0khv.mongodb.net:27017,cluster0-shard-00-02-m0khv.mongodb.net:27017/mrcupon_dev?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin',
    test: 'mongodb://api:*1426*agjmig2211@cluster0-shard-00-00-m0khv.mongodb.net:27017,cluster0-shard-00-01-m0khv.mongodb.net:27017,cluster0-shard-00-02-m0khv.mongodb.net:27017/mrcupon_dev?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin',
    production: 'mongodb://mrcuponapi:' + process.env.MONGODB_PROD_PASSWORD + '@production-shard-00-00-m0khv.mongodb.net:27017,production-shard-00-01-m0khv.mongodb.net:27017,production-shard-00-02-m0khv.mongodb.net:27017/mrcupon_prod?ssl=true&replicaSet=Production-shard-0&authSource=admin'
});

config.authConfig = Object.freeze({
    jwtSecret: 's3cr3tK3Yf0rMrCup0nS1nc323012018',
    refreshSecret: 's3cr3tF0rR3fr35h70k3nsS1nc323012018',
    issuer: 'auth.mrcupon.co'
});

module.exports = config;
