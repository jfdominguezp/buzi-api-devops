const mocha           = require('mocha');
const chai            = require('chai');
const chaiHttp        = require('chai-http');
const should          = chai.should();
const server          = require('../../../server');
const seed            = require('./seed.json');
const { auth, db }    = require('../../../api/errors/error-types');

const LocalUser = require('../../../api/models/local-user');
const Business  = require('../../../api/models/business');

const { it, describe, beforeEach } = mocha;
const BASE_PATH = '/api/auth/business';

//General variables
let business;
let addResponse;

chai.use(chaiHttp);

describe('Business Auth', () => {
    describe('POST /api/auth/business/signup', () => {

        beforeEach('clean businesses and local users', async () => {
            await Business.remove({});
            await LocalUser.remove({});
            business = Object.assign({ }, seed.business);
        });

        it ('it should create a business and a local user', async () => {
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(seed.business);
            
            response.should.have.status(200);
            response.body.should.be.a('object');

            //userId represents the local user
            response.body.should.have.property('userId');
            response.body.should.have.property('data');

            //data._id represents the business record
            response.body.data.should.have.property('_id');
            response.body.data.should.have.property('name').eql(seed.business.name);
        });

        it ('it should not create a business with invalid email', async () => {
            business.email = 'test@test';
            const { code, statusCode } = db.VALIDATOR_ERROR;
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });

        it ('it should not create a business without email, username or password', async () => {
            const { code, statusCode } = auth.INVALID_CREDENTIALS;
            //Email validation
            delete business.email;
            let response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);

            //Username validation
            business = Object.assign({ }, seed.business);
            delete business.username;
            response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);

            //Password validation
            business = Object.assign({ }, seed.business);
            delete business.password;
            response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });

        it ('it should not create a business with required fields missing', async () => {
            delete business.name;
            const { code, statusCode } = db.VALIDATOR_ERROR;
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });

        it ('it should not create a business with bad structure', async () => {
            business.contactData = "Contact data";
            const { code, statusCode } = db.VALIDATOR_ERROR;
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });

        it ('it should not create a business user with an already existing email or username', async () => {
            const { code, statusCode } = db.DUPLICATE_KEY;
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(200);
            response.body.should.have.property('userId');

            const resend = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);

            resend.should.have.status(statusCode);
            resend.body.should.have.property('apiErrorCode').eql(code);
        });
    });

    describe ('POST /api/auth/business/signin', () => {
        beforeEach('clean and insert base user', async () => {
            business = Object.assign({ }, seed.business);
            await Business.remove({});
            await LocalUser.remove({});
            addResponse = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(seed.business);
        });
    
        it ('it should sign a business in with email or username and password', async () => {
            const { userId, data } = addResponse.body;
            const { email, username, password } = business;
    
            //Email & password
            let response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ email, password });
    
            response.should.have.status(200);
            response.body.should.have.property('userId').eql(userId);
            response.body.should.have.property('data');
            response.body.data.should.have.property('_id').eql(data._id);
    
            //Username & password
            response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ username, password });
            response.should.have.status(200);
            response.body.should.have.property('userId').eql(userId);
            response.body.should.have.property('data');
            response.body.data.should.have.property('_id').eql(data._id);
        });
    
        it ('it should not sign a business in without a password', async () => {
            const { email, username } = business;
            const { code, statusCode } = auth.INVALID_CREDENTIALS;
    
    
            let response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ email });
                
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
    
            response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ username });
    
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });

        it ('it should not sign a business in with an unregistered email or username', async () => {
            const email = 'random@email.com';
            const username = 'random_username';
            const { password } = business;
            const { code, statusCode } = auth.INVALID_CREDENTIALS;

            let response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ email, password });

            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);

            response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ username, password });

            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);

        });

        it ('it should not sign a business in with an incorrect password', async () => {
            const { code, statusCode } = auth.INCORRECT_PASSWORD;
            const password = "incorrect_password";
            const { email, username } = business;

            let response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ email, password });
            
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);

            response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ username, password });
            
            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);

        });
    });
});