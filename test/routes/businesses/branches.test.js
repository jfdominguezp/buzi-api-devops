const mocha             = require('mocha');
const chai              = require('chai');
const chaiHttp          = require('chai-http');
const should            = chai.should();
const server            = require('../../../server');
const seed              = require('./seed.json');
const ErrorTypes        = require('../../../api/errors/error-types');

const Business     = require('../../../api/models/member');
const LocalUser    = require('../../../api/models/local-user');
const RefreshToken = require('../../../api/models/refresh-token');
const VerifyToken  = require('../../../api/models/verify-token');

const { it, describe, before } = mocha;
const BASE_PATH = '/api/businesses';
const { NOT_FOUND } = ErrorTypes.general;

const { VALIDATOR_ERROR, CAST_ERROR } = ErrorTypes.db;
const { branch, business } = seed;

//General variables
let authenticatedBusiness;

chai.use(chaiHttp);

describe ('Branches', () => {

    describe ('POST /api/businesses/branches', () => {
        before ('Create business and sign in', async () => {
            await Business.remove({});
            await LocalUser.remove({});
            await RefreshToken.remove({});
            await VerifyToken.remove({});

            await chai.request(server)
                .post('/api/auth/business/signup')
                .send(business);
            
            const { username, password } = business;
    
            const response = await chai.request(server)
                .post('/api/auth/business/signin')
                .send({ username, password });
            
            authenticatedBusiness = response.body;
        });

        it ('it should add a branch for the authenticated business', async () => {
            const response = await chai.request(server)
                .post(`${BASE_PATH}/branches`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(branch);
            response.should.have.status(200);

            const updatedBusiness = response.body;

            updatedBusiness.branches.should.be.an('array').and.have.lengthOf(1);

            const [newBranch] = updatedBusiness.branches; 
            newBranch.should.have.property('_id');
            newBranch.should.deep.include(branch);
        });

        it ('it should not add a branch if not authenticated', async () => {
            const response = await chai.request(server)
                .post(`${BASE_PATH}/branches`)
                .send(branch);
            
            response.should.have.status(401);
        });

        it ('it should not add a branch if bad model', async () => {
            const badBranch = Object.assign({}, branch);
            delete badBranch.name;

            const response = await chai.request(server)
                .post(`${BASE_PATH}/branches`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(badBranch);

            const { statusCode, code } = VALIDATOR_ERROR;

            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);          
        });
    });

    describe ('PUT /api/businesses/branches/:id', () => {
        let businessWithBranches;

        before ('Sign business up and add two branches', async () => {
            await Business.remove({});
            await LocalUser.remove({});
            await RefreshToken.remove({});
            await VerifyToken.remove({});

            await chai.request(server)
                .post('/api/auth/business/signup')
                .send(business);
            
            const { username, password } = business;
    
            let response = await chai.request(server)
                .post('/api/auth/business/signin')
                .send({ username, password });
            
            authenticatedBusiness = response.body;

            response = await chai.request(server)
                .post(`${BASE_PATH}/branches`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(branch);

            response = await chai.request(server)
                .post(`${BASE_PATH}/branches`)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(branch);

            businessWithBranches = response.body;
        });

        it ('it should update the specified branch if authenticated', async () => {
            const updateFields = { name: 'Updated name' };
            
            const [targetBranch] = businessWithBranches.branches;
            const address = `${BASE_PATH}/branches/${targetBranch._id}`
            const response = await chai.request(server)
                .put(address)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);

            response.should.have.status(200);
            const updatedBranch = response.body.branches.find(branch => branch._id === targetBranch._id);
            updatedBranch.should.deep.include(updateFields);
        });

        it ('it should not update a branch if not authenticated', async () => {
            const updateFields = { name: 'Updated name' };
            
            const [targetBranch] = businessWithBranches.branches;
            const address = `${BASE_PATH}/branches/${targetBranch._id}`
            const response = await chai.request(server)
                .put(address)
                .send(updateFields);
            
            response.should.have.status(401);
        });

        it ('it should not update a branch if id is not an ObjectId', async () => {
            const updateFields = { name: 'Updated name' };
            
            const address = `${BASE_PATH}/branches/12346`
            const response = await chai.request(server)
                .put(address)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            const { statusCode, code } = CAST_ERROR;

            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });

        it ('it should not update an unexistent branch', async () => {
            const updateFields = { name: 'Updated name' };
            
            const address = `${BASE_PATH}/branches/5b53b464d28d937e274131dc`
            const response = await chai.request(server)
                .put(address)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send(updateFields);
            
            const { statusCode, code } = NOT_FOUND;

            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });
    });
});