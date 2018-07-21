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
const BASE_PATH = '/api/deals';
const { NOT_FOUND } = ErrorTypes.general;
const { VALIDATOR_ERROR, CAST_ERROR } = ErrorTypes.db;
const { business, deal } = seed;

//General variables
let authenticatedBusiness;
let savedDeal;

chai.use(chaiHttp);

describe('Deals', () => {

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

    describe('POST /api/deals', () => {
        it ('it should create a deal', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(deal);

            response.should.have.status(200);
            response.body.should.have.property('_id');
            response.body.should.have.property('kind').eql('Deal');
            response.body.should.have.property('businessId').eql(authenticatedBusiness.data._id);
            response.body.should.include.all.keys(deal);
        });

        it ('it should not create a deal if model invalid', async () => {
            const badDeal = Object.assign({ }, deal);
            delete badDeal.name;

            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(badDeal);
            
            response.should.have.status(VALIDATOR_ERROR.statusCode);
            response.body.should.have.property('apiErrorCode').eql(VALIDATOR_ERROR.code);
        });

        it ('it should not create a deal if not authenticated', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .send(deal);
            
            response.should.have.status(401);
        });
    });

    describe('GET /api/deals', () => {
        before('add another deal', async () => {
            await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(deal);
        });

        it ('it should get a list of the business deals', async () => {
            const response = await chai.request(server)
                .get(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`);
            
            response.should.have.status(200);
            response.body.should.be.an('array').and.have.lengthOf(2);

            response.body.forEach(deal => {
                deal.should.have.property('_id');
                deal.should.have.property('kind').eql('Deal');
                deal.should.include.all.keys(deal);
            });
        });

        it ('it should not retrieve a list of deals if not authenticated', async () => {
            const response = await chai.request(server)
                .get(BASE_PATH);
            
            response.should.have.status(401);
        });
    });

    describe('GET /api/deals/:id', () => {
        before('add another deal', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(deal);

            savedDeal = response.body;
        });

        it ('it should retrieve a deal by id', async () => {
            const response = await chai.request(server)
                .get(`${BASE_PATH}/${savedDeal._id}`);
            
            response.should.have.status(200);
            response.body.should.have.property('_id').eql(savedDeal._id);
            response.body.should.include.all.keys(deal);
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

    describe('PUT /api/deals/:id', () => {

        const updateFields = { endDate: '2020-05-25T14:00:00.000Z' };

        before('add another deal', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(deal);

            savedDeal = response.body;
        });

        it ('it should update a deal', async () => {
            const response = await chai.request(server)
                .put(`${BASE_PATH}/${savedDeal._id}`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            response.should.have.status(200);
            response.body.should.include.all.keys(deal);
            response.body.should.include(updateFields);
        });

        it ('it should fail if not authenticated', async () => {
            const response = await chai.request(server)
                .put(`${BASE_PATH}/${savedDeal._id}`)
                .send(updateFields);
            
            response.should.have.status(401);
        });

        it ('it should fail if id is not an ObjectId', async () => {
            const response = await chai.request(server)
                .put(`${BASE_PATH}/123456`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            response.should.have.status(CAST_ERROR.statusCode);
            response.body.should.have.property('apiErrorCode').eql(CAST_ERROR.code);
        });

        it ('it should fail if id does not exist', async () => {
            const response = await chai.request(server)
                .put(`${BASE_PATH}/5b51fcf17001b614a0b70b64`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            response.should.have.status(NOT_FOUND.statusCode);
            response.body.should.have.property('apiErrorCode').eql(NOT_FOUND.code);
        });
    });

    describe('Ensure deals ownership', () => {
        let alienDeal;
        const updateFields = { endDate: '2020-05-25T14:00:00.000Z' };

        before ('create second business, sign in and create deal', async () => {
            const newBusiness = { 
                ...business, 
                email: 'other@email.com', 
                username: 'otherusername' 
            };
            await chai.request(server)
                .post('/api/auth/business/signup')
                .send(newBusiness);

            const { username, password } = newBusiness;

            const authResponse = await chai.request(server)
                .post('/api/auth/business/signin')
                .send({ username, password });

            const dealResponse = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authResponse.body.tokens.accessToken}`)
                .send(deal);
            
            alienDeal = dealResponse.body;
        });

        it ('it should not update a reward that belongs to another business', async () => {
            const response = await chai.request(server)
                .put(`${BASE_PATH}/${alienDeal._id}`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            response.should.have.status(NOT_FOUND.statusCode);
            response.body.should.have.property('apiErrorCode').eql(NOT_FOUND.code);
        });
    })
});