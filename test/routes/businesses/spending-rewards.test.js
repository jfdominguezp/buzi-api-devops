const mocha             = require('mocha');
const chai              = require('chai');
const chaiHttp          = require('chai-http');
const should            = chai.should();
const server            = require('../../../server');
const seed              = require('./seed.json');
const ErrorTypes        = require('../../../api/errors/error-types');

const Business       = require('../../../api/models/member');
const LocalUser      = require('../../../api/models/local-user');
const RefreshToken   = require('../../../api/models/refresh-token');
const VerifyToken    = require('../../../api/models/verify-token');
const SpendingReward = require('../../../api/models/benefit-spending-reward');

const { it, describe, before } = mocha;
const BASE_PATH = '/api/businesses/spendingrewards';
const { NOT_FOUND } = ErrorTypes.general;

const { VALIDATOR_ERROR } = ErrorTypes.db;
const { business, reward } = seed;

chai.use(chaiHttp);

//General variables
let authenticatedBusiness;
let createdRewards = [];

describe ('Spending rewards', () => {
    before ('Cleand DB, register business, authenticate, create 4 rewards', async () => {
        await LocalUser.remove({});
        await Business.remove({});
        await RefreshToken.remove({});
        await VerifyToken.remove({});
        await SpendingReward.remove({});

        await chai.request(server)
            .post('/api/auth/business/signup')
            .send(business);

        const { username, password } = business;

        const response = await chai.request(server)
            .post('/api/auth/business/signin')
            .send({ username, password });

        authenticatedBusiness = response.body;

        let rewardResponse = await chai.request(server)
            .post('/api/rewards')
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(reward);
        
        createdRewards.push(rewardResponse.body);

        rewardResponse = await chai.request(server)
            .post('/api/rewards')
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(reward);
        
        createdRewards.push(rewardResponse.body);

        rewardResponse = await chai.request(server)
            .post('/api/rewards')
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(reward);
        
        createdRewards.push(rewardResponse.body);

        rewardResponse = await chai.request(server)
            .post('/api/rewards')
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(reward);

        createdRewards.push(rewardResponse.body);
    });

    it('it should set the activeSpendingRewards array in business document', async () => {
        const [ first, second, third ] = createdRewards;
        const payload = [ first, second, third ].map(reward => {
            return { benefitId: reward._id, goalAmount: 50000 };
        });

        const response = await chai.request(server)
            .put(BASE_PATH)
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(payload);

        response.should.have.status(200);
        response.body.should.have.property('activeSpendingRewards');

        const returnedRewards = response.body.activeSpendingRewards;
        returnedRewards.forEach(reward => reward.should.include.keys(payload[0]));
    });

    it ('it should fail if business not authenticated', async () => {
        const [ first, second, third ] = createdRewards;
        const payload = [ first, second, third ].map(reward => {
            return { benefitId: reward._id, goalAmount: 50000 };
        });

        const response = await chai.request(server)
            .put(BASE_PATH)
            .send(payload);

        response.should.have.status(401);
    });

    it ('it should fail if bad model provided', async () => {
        const [ first, second, third ] = createdRewards;
        const payload = [ first, second, third ].map(reward => {
            return { benefitId: reward._id };
        });

        const response = await chai.request(server)
            .put(BASE_PATH)
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(payload);

        const { statusCode, code } = VALIDATOR_ERROR;
        response.should.have.status(statusCode);
        response.body.should.have.property('apiErrorCode').eql(code);
    });
});