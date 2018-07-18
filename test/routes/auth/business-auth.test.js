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

        it ('it should not create a business with missing credentials or validation errors', async () => {
            const { VALIDATOR_ERROR } = db;
            const { INVALID_CREDENTIALS } = auth;
            const cases = [];
            const addCase = (errorCase) => {
                cases.push(errorCase);
                business = Object.assign({ }, business);
            }
            
            //Bad email
            business.email = 'test@test';
            addCase({ business, errorType: VALIDATOR_ERROR });

            //No email
            delete business.email;
            addCase({ business, errorType: INVALID_CREDENTIALS });

            //No username
            delete business.username;
            addCase({ business, errorType: INVALID_CREDENTIALS });

            //No password
            delete business.password;
            addCase({ business, errorType: INVALID_CREDENTIALS });

            //Required fields missing
            delete business.name;
            addCase({ business, errorType: VALIDATOR_ERROR });

            //Bad structure
            business.contactData = "Contact data";
            addCase({ business, errorType: VALIDATOR_ERROR });

            let response;
            cases.forEach(async ({ business, errorType }) => {
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .post(`${BASE_PATH}/signup`)
                    .send(business);
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            });

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
    
        it ('it should not sign a business in if wrong credentials given or user does not exist', async () => {
            const { email, username, password } = business;
            const { INVALID_CREDENTIALS, INCORRECT_PASSWORD } = auth;

            const cases = [
                //No password
                { credentials: { email }, errorType: INVALID_CREDENTIALS },
                { credentials: { username }, errorType: INVALID_CREDENTIALS },
                //No email or username
                { credentials: { password }, errorType: INVALID_CREDENTIALS },
                //Unregistered email or username
                { credentials: { password, email: 'x@x.com' }, errorType: INVALID_CREDENTIALS },
                { credentials: { password, username: 'xxx' }, errorType: INVALID_CREDENTIALS },
                //Wrong password
                { credentials: { email, password: 'incorrect_password' }, errorType: INCORRECT_PASSWORD },
                { credentials: { username, password: 'incorrect_password' }, errorType: INCORRECT_PASSWORD }
            ];

            let response;
            cases.forEach(async ({ credentials, errorType }) => {
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .post(`${BASE_PATH}/signin`)
                    .send(credentials);
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            });
        });
    });
});