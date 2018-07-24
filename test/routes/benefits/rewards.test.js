const mocha             = require('mocha');
const chai              = require('chai');
const chaiHttp          = require('chai-http');
const should            = chai.should();
const server            = require('../../../server');
const seed              = require('./seed.json');
const ErrorTypes        = require('../../../api/errors/error-types');

const Business     = require('../../../api/models/member');
const LocalUser    = require('../../../api/models/local-user');
const Benefit      = require('../../../api/models/benefit');
const RefreshToken = require('../../../api/models/refresh-token');
const VerifyToken  = require('../../../api/models/verify-token');

const { it, describe, before, after } = mocha;
const BASE_PATH = '/api/rewards';
const { NOT_FOUND } = ErrorTypes.general;
const { VALIDATOR_ERROR, CAST_ERROR } = ErrorTypes.db;
const { business, spendingReward } = seed;

//General variables
let authenticatedBusiness;
let savedReward;

chai.use(chaiHttp);

describe('Rewards', () => {

    before('Clean DB, sign business up and authenticate', async () => {
        await Business.remove({});
        await LocalUser.remove({});
        await Benefit.remove({});
        await RefreshToken.remove({});
        await VerifyToken.remove({});

        await chai.request(server)
            .post('/api/auth/business/signup')
            .send(business);

        const { username, password } = business;

        const response = await chai.request(server)
            .post('/api/auth/business/signin')
            .send({ username, password });

        response.should.have.status(200);

        authenticatedBusiness = response.body;
    });

    after('Empty DB', async () => {
        await Business.remove({});
        await LocalUser.remove({});
        await Benefit.remove({});
        await RefreshToken.remove({});
        await VerifyToken.remove({});
    });

    describe('POST /api/rewards', () => {
        it ('it should create a reward', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(spendingReward);

            response.should.have.status(200);
            response.body.should.have.property('_id');
            response.body.should.have.property('kind').eql('SpendingReward');
            response.body.should.have.property('businessId').eql(authenticatedBusiness.data._id);
            response.body.should.include.all.keys(spendingReward);
        });

        it ('it should not create a reward if model invalid', async () => {
            const badReward = Object.assign({ }, spendingReward);
            delete badReward.name;

            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(badReward);
            
            response.should.have.status(VALIDATOR_ERROR.statusCode);
            response.body.should.have.property('apiErrorCode').eql(VALIDATOR_ERROR.code);
        });

        it ('it should not create a reward if not authenticated', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .send(spendingReward);
            
            response.should.have.status(401);
        });
    });

    describe('GET /api/rewards', () => {
        before('add another reward', async () => {
            await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(spendingReward);
        });

        it ('it should get a list of the business rewards', async () => {
            const response = await chai.request(server)
                .get(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`);
            
            response.should.have.status(200);
            response.body.should.be.an('array').and.have.lengthOf(2);

            response.body.forEach(reward => {
                reward.should.have.property('_id');
                reward.should.have.property('kind').eql('SpendingReward');
                reward.should.include.all.keys(spendingReward);
            });
        });

        it ('it should not retrieve a list of rewards if not authenticated', async () => {
            const response = await chai.request(server)
                .get(BASE_PATH);
            
            response.should.have.status(401);
        });
    });

    describe('GET /api/rewards/:id', () => {
        before('add another reward', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(spendingReward);

            savedReward = response.body;
        });

        it ('it should retrieve a reward by id', async () => {
            const response = await chai.request(server)
                .get(`${BASE_PATH}/${savedReward._id}`);
            
            response.should.have.status(200);
            response.body.should.have.property('_id').eql(savedReward._id);
            response.body.should.include.all.keys(spendingReward);
        });

        it ('it should fail if id is not an ObjectId', async () => {
            const response = await chai.request(server)
                .get(`${BASE_PATH}/123456`);
            
            response.should.have.status(CAST_ERROR.statusCode);
            response.body.should.have.property('apiErrorCode').eql(CAST_ERROR.code);
        });

        it ('it should fail if id does not exist', async () => {
            const response = await chai.request(server)
                .get(`${BASE_PATH}/5b51fcf17001b614a0b70b64`);
            
            response.should.have.status(NOT_FOUND.statusCode);
            response.body.should.have.property('apiErrorCode').eql(NOT_FOUND.code);
        });
    });

    describe('PUT /api/rewards/:id', () => {
        before('add another reward', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(spendingReward);

            savedReward = response.body;
        });

        it ('it should update a reward', async () => {
            const updateFields = { rewardType: 'Cashback' };

            const response = await chai.request(server)
                .put(`${BASE_PATH}/${savedReward._id}`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            response.should.have.status(200);
            response.body.should.include.all.keys(spendingReward);
            response.body.should.include(updateFields);
        });

        it ('it should fail if not authenticated', async () => {
            const updateFields = { rewardType: 'Cashback' };

            const response = await chai.request(server)
                .put(`${BASE_PATH}/${savedReward._id}`)
                .send(updateFields);
            
            response.should.have.status(401);
        });

        it ('it should fail if id is not an ObjectId', async () => {
            const updateFields = { rewardType: 'Cashback' };

            const response = await chai.request(server)
                .put(`${BASE_PATH}/123456`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            response.should.have.status(CAST_ERROR.statusCode);
            response.body.should.have.property('apiErrorCode').eql(CAST_ERROR.code);
        });

        it ('it should fail if id does not exist', async () => {
            const updateFields = { rewardType: 'Cashback' };

            const response = await chai.request(server)
                .put(`${BASE_PATH}/5b51fcf17001b614a0b70b64`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            response.should.have.status(NOT_FOUND.statusCode);
            response.body.should.have.property('apiErrorCode').eql(NOT_FOUND.code);
        });
    });

    describe('Ensure rewards ownership', () => {
        let alienReward;
        before ('create second business, sign in and create reward', async () => {
            const newBusiness = { 
                ...business, 
                email: 'other@email.com', 
                username: 'otherusername',
                phone: '3006978539'
            };
            await chai.request(server)
                .post('/api/auth/business/signup')
                .send(newBusiness);

            const { username, password } = newBusiness;

            const authResponse = await chai.request(server)
                .post('/api/auth/business/signin')
                .send({ username, password });

            const rewardResponse = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authResponse.body.tokens.accessToken}`)
                .send(spendingReward);
            
            alienReward = rewardResponse.body;
        });

        it ('it should not update a reward that belongs to another business', async () => {
            const updateFields = { rewardType: 'Cashback' };

            const response = await chai.request(server)
                .put(`${BASE_PATH}/${alienReward._id}`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            response.should.have.status(NOT_FOUND.statusCode);
            response.body.should.have.property('apiErrorCode').eql(NOT_FOUND.code);
        });
    })
});