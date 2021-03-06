const mocha                 = require('mocha');
const chai                  = require('chai');
const chaiHttp              = require('chai-http');
const should                = chai.should();
const server                = require('../../../server');
const seed                  = require('./seed.json');
const { auth, db, general } = require('../../../api/errors/error-types');

const LocalUser  = require('../../../api/models/local-user');
const Member     = require('../../../api/models/member');
const ResetToken = require('../../../api/models/reset-token');

const { it, describe, beforeEach } = mocha;
const BASE_PATH = '/api/auth';

const { INVALID_CREDENTIALS, INCORRECT_PASSWORD } = auth;
const { BAD_REQUEST, NOT_FOUND } = general;
const { VALIDATOR_ERROR, DUPLICATE_KEY } = db;

//General variables
let member;
let addResponse;
let resetToken;

chai.use(chaiHttp);

describe('Member Auth', () => {
    describe('POST /api/auth/signup', () => {

        beforeEach('clean members and local users', async () => {
            await Member.remove({});
            await LocalUser.remove({});
            member = Object.assign({ }, seed.member);
        });

        it ('it should create a member and a local user', async () => {
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(member);
            
            response.should.have.status(200);
            response.body.should.be.a('object');

            //userId represents the local user
            response.body.should.have.property('userId');
            response.body.should.have.property('data');

            //data._id represents the business record
            response.body.data.should.have.property('_id');
            response.body.data.should.have.property('name').eql(member.name);
            response.body.data.should.have.property('familyName').eql(member.familyName);
        });

        it ('it should not create a member with missing credentials or validation errors', async () => {
            const cases = [];
            const addCase = (errorCase) => {
                cases.push(errorCase);
                member = Object.assign({ }, seed.member);
            }

            member.email = 'test@test';
            addCase({ member, errorType: VALIDATOR_ERROR });

            delete member.name;
            addCase({ member, errorType: VALIDATOR_ERROR });

            delete member.familyName;
            addCase({ member, errorType: VALIDATOR_ERROR });

            delete member.email;
            addCase({ member, errorType: INVALID_CREDENTIALS });

            delete member.password;
            addCase({ member, errorType: INVALID_CREDENTIALS });
            let response;
            for (let i = 0; i < cases.length; i++) {
                const { member, errorType } = cases[i]
                const { code, statusCode } = errorType;
                try {
                    response = await chai.request(server)
                    .post(`${BASE_PATH}/signup`)
                    .send(member);
                    response.should.have.status(statusCode);
                    response.body.should.have.property('apiErrorCode').eql(code);
                } catch (error) {
                    return error;
                }
            }
        });

        it ('it should not create a member user with an already existing email', async () => {
            const { code, statusCode } = DUPLICATE_KEY;
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(member);
            response.should.have.status(200);
            response.body.should.have.property('userId');

            const resend = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(member);

            resend.should.have.status(statusCode);
            resend.body.should.have.property('apiErrorCode').eql(code);
        });
    });

    describe('POST /api/auth/signin', () => {
        beforeEach('clean and insert base user', async () => {
            member = Object.assign({ }, seed.business);
            await Member.remove({});
            await LocalUser.remove({});
            addResponse = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(seed.member);
        });

        it ('it should sign a member in', async () => {
            const { userId, data } = addResponse.body;
            const { email, password } = member;
    
            //Email & password
            let response = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ email, password });
    
            response.should.have.status(200);
            response.body.should.have.property('userId').eql(userId);
            response.body.should.have.property('data');
            response.body.data.should.have.property('_id').eql(data._id);
        });

        it ('it should not sign a member in with missing credentials, incorrect password or unexistent email', async () => {
            const { email, password } = member;

            const cases = [
                { credentials: { email }, errorType: INVALID_CREDENTIALS },
                { credentials: { password }, errorType: INVALID_CREDENTIALS },
                { credentials: { email, password: 'xxx' }, errorType: INCORRECT_PASSWORD },
                { credentials: { password, email: 'random@random.com' }, errorType: INVALID_CREDENTIALS }
            ];

            let response;
            for (let i = 0; i < cases.length; i++) {
                const { credentials, errorType } = cases[i];
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .post(`${BASE_PATH}/signin`)
                    .send(credentials);
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            }
        });
    });

    describe ('POST /api/auth/reset', () => {
        beforeEach('clean and insert base user', async () => {
            member = Object.assign({ }, seed.member);
            await Member.remove({});
            await LocalUser.remove({});
            await ResetToken.remove({});
            addResponse = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(seed.member);
        });

        it ('it should create a reset token', async () => {
            const { email } = member;
            const response = await chai.request(server)
                .post(`${BASE_PATH}/reset`)
                .send({ email });
            response.should.have.status(200);

            const { userId } = addResponse.body;

            const tokens = await ResetToken.find({ userId, used: false });
            tokens.should.be.an('array').and.have.lengthOf(1);
        });

        it ('it should not create a reset token if email is missing, invalid or does not exist', async () => {
            let response;
            const cases = [
                { email: null, errorType: BAD_REQUEST },
                { email: 'invalid', errorType: BAD_REQUEST },
                { email: 'inexis@te.nt', errorType: NOT_FOUND }
            ];

            for (let i = 0; i < cases.length; i++) {
                const { email, errorType } = cases[i];
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .post(`${BASE_PATH}/reset`)
                    .send({ email });
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            }

            const tokens = await ResetToken.find({});
            tokens.should.be.an('array').and.have.lengthOf(0);

        }); 
    });

    describe ('PUT /api/auth/reset', () => {
        beforeEach('clean and insert base user', async () => {
            member = Object.assign({ }, seed.member);
            await Member.remove({});
            await LocalUser.remove({});
            await ResetToken.remove({});
            addResponse = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(seed.member);
            await chai.request(server)
                .post(`${BASE_PATH}/reset`)
                .send({ email: seed.member.email });
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
                .send({ email: member.email, password: payload.password });
            
            signedIn.should.have.status(200);
            signedIn.body.should.have.property('userId').eql(userId);
            signedIn.body.should.have.property('data');
            signedIn.body.data.should.have.property('_id').eql(data._id);
        });

        it ('it should not reset the password if a bad token is passed or request is incomplete', async () => {

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
            for (let i = 0; i < cases.length; i++) {
                const { payload, errorType } = cases[i];
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .put(`${BASE_PATH}/reset`)
                    .send(payload);
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            }

            const { email, password } = member;
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