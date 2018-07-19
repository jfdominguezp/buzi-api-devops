const mocha                 = require('mocha');
const chai                  = require('chai');
const chaiHttp              = require('chai-http');
const should                = chai.should();
const server                = require('../../../server');
const seed                  = require('./seed.json');
const { auth, db, general } = require('../../../api/errors/error-types');

const LocalUser  = require('../../../api/models/local-user');
const Business   = require('../../../api/models/business');
const ResetToken = require('../../../api/models/reset-token');
const { it, describe, beforeEach } = mocha;
const BASE_PATH = '/api/auth/business';

//General variables
let business;
let addResponse;
let resetToken;

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
                business = Object.assign({ }, seed.business);
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

    describe ('POST /api/auth/business/reset', () => {
        beforeEach('clean and insert base user', async () => {
            business = Object.assign({ }, seed.business);
            await Business.remove({});
            await LocalUser.remove({});
            await ResetToken.remove({});
            addResponse = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(seed.business);
        });

        it ('it should create a reset token', async () => {
            const { email } = business;
            const response = await chai.request(server)
                .post(`${BASE_PATH}/reset`)
                .send({ email });
            response.should.have.status(200);

            const { userId } = addResponse.body;

            const tokens = await ResetToken.find({ userId, used: false });
            tokens.should.be.an('array').and.have.lengthOf(1);
        });

        it ('it should not create a reset token if email is missing, invalid or does not exist', async () => {
            const { NOT_FOUND, BAD_REQUEST } = general;
            let response;
            const cases = [
                { email: null, errorType: BAD_REQUEST },
                { email: 'invalid', errorType: BAD_REQUEST },
                { email: 'inexis@te.nt', errorType: NOT_FOUND }
            ];

            cases.forEach(async ({ email, errorType }) => {
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .post(`${BASE_PATH}/reset`)
                    .send({ email });
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            });

            const tokens = await ResetToken.find({});
            tokens.should.be.an('array').and.have.lengthOf(0);

        }); 
    });

    describe ('PUT /api/auth/business/reset', () => {
        beforeEach('clean and insert base user', async () => {
            business = Object.assign({ }, seed.business);
            await Business.remove({});
            await LocalUser.remove({});
            await ResetToken.remove({});
            addResponse = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(seed.business);
            await chai.request(server)
                .post(`${BASE_PATH}/reset`)
                .send({ email: seed.business.email });
            resetToken = await ResetToken.findOne({});
        });

        it ('it should reset the password', async () => {
            const payload = {
                _id: addResponse.body.userId,
                token: resetToken.token,
                password: 'NewPassword123*'
            };

            const { userId, data } = addResponse.body;

            const response = await chai.request(server)
                .put(`${BASE_PATH}/reset`)
                .send(payload);
            
            response.should.have.status(200);
            
            const signedIn = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ email: business.email, password: payload.password });
            
            signedIn.should.have.status(200);
            signedIn.body.should.have.property('userId').eql(userId);
            signedIn.body.should.have.property('data');
            signedIn.body.data.should.have.property('_id').eql(data._id);
        });

        it ('it should not reset the password if a bad token is passed or request is incomplete', async () => {
            const { BAD_REQUEST, NOT_FOUND } = general;
            const cases = [
                {
                    payload: { _id: 'abcdefg4567', token: 'abcd', password: 'NewPassword123*' },
                    errorType: NOT_FOUND
                },
                {
                    payload: { _id: addResponse.body.userId, password: 'NewPassword123*' },
                    errorType: BAD_REQUEST
                },
                {
                    payload: { token: resetToken.token, password: 'NewPassword123*' },
                    errorType: BAD_REQUEST
                },
                {
                    payload: { _id: addResponse.body.userId, token: resetToken.token },
                    errorType: BAD_REQUEST
                },
            ];

            let response;
            cases.forEach(async ({ payload, errorType }) => {
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .put(`${BASE_PATH}/reset`)
                    .send(payload);
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            });

            const { email, password } = business;
            const { userId, data } = addResponse.body;

            const signedIn = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ email, password });
            
            signedIn.should.have.status(200);
            signedIn.body.should.have.property('userId').eql(userId);
            signedIn.body.should.have.property('data');
            signedIn.body.data.should.have.property('_id').eql(data._id);
        });
    });
});