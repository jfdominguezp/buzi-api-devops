const mocha                 = require('mocha');
const chai                  = require('chai');
const chaiHttp              = require('chai-http');
const jwt                   = require('jsonwebtoken');
const should                = chai.should();
const server                = require('../../../server');
const seed                  = require('./seed.json');
const { auth, general } = require('../../../api/errors/error-types');

const Member       = require('../../../api/models/member');
const LocalUser    = require('../../../api/models/local-user');
const RefreshToken = require('../../../api/models/refresh-token');
const VerifyToken  = require('../../../api/models/verify-token');

const { it, describe, before, beforeEach } = mocha;
const BASE_PATH = '/api/auth';
const { BAD_REQUEST, NOT_FOUND } = general;
const { BAD_REFRESH_TOKEN } = auth;

chai.use(chaiHttp);

//General variables
let member;
let signinResponse;
let addResponse;
let verifyToken;

describe('Auth common', () => {
    /**
     * We use the member schema because is the easiest one. This
     * test is focused on LocalUser. In other test sets, we evaluate
     * if inserting a member or a business also inserts a local user.
     */
    describe('POST /api/auth/token', () => {
        beforeEach('clean data and create member', async () => {
            member = Object.assign({ }, seed.member);
            await RefreshToken.remove({});
            await LocalUser.remove({});
            await Member.remove({});
            
            await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(member);
            
            const { email, password } = member;
            signinResponse = await chai.request(server)
                .post(`${BASE_PATH}/signin`)
                .send({ email, password });
        });
        
        it ('it should return a new access token with a valid refresh token', async () => {
            const payload = {
                userId: signinResponse.body.userId,
                refreshToken: signinResponse.body.tokens.refreshToken
            };

            const response = await chai.request(server)
                .post(`${BASE_PATH}/token`)
                .send(payload);
            
            response.should.have.status(200);
            response.body.should.have.property('accessToken');

            const { accessToken } = response.body;
            const decoded = jwt.decode(accessToken);

            decoded.should.have.property('email').eql(member.email);
            decoded.should.have.property('_id').eql(signinResponse.body.userId);
            decoded.should.have.property('connection');
        });

        it ('it should not issue a new access token if incomplete request or bad refresh token or user id provided', async () => {
            const cases = [
                { 
                    payload:  { userId: signinResponse.body.userId },
                    errorType: BAD_REQUEST
                },
                {
                    payload: { refreshToken: signinResponse.body.tokens.refreshToken },
                    errorType: BAD_REQUEST
                },
                { 
                    payload:  { userId: signinResponse.body.userId, refreshToken: 'abc123' },
                    errorType: BAD_REFRESH_TOKEN
                },
                {
                    payload: { userId: 'abc', refreshToken: signinResponse.body.tokens.refreshToken },
                    errorType: NOT_FOUND
                }
            ];

            let response;
            for (let i = 0; i < cases.length; i++) {
                const { payload, errorType } = cases[i];
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .post(`${BASE_PATH}/token`)
                    .send(payload);             
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            }
        });
    });

    describe('GET /api/auth/verify', () => {
        before('clean data and create member', async () => {
            await RefreshToken.remove({});
            await LocalUser.remove({});
            await Member.remove({});
            await VerifyToken.remove({});

            member = Object.assign({ }, seed.member);
            member.email = 'other@email.com';
            member.phone = '5555555';
            
            addResponse = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(member);
            
            verifyToken = await VerifyToken.findOne({ });
        });

        it ('it should verify an email', async () => {
            const { userId, token, provider, isSocial } = verifyToken;

            const response = await chai.request(server)
                .get(`${BASE_PATH}/verify?userId=${userId}&token=${token}&provider=${provider}&isSocial=${isSocial}`);

            response.should.have.status(200);
            response.body.should.have.property('_id').eql(addResponse.body.userId);
            response.body.should.have.property('email_verified').eql(true);
        });

        it ('it should not verify an email if missing properties, bad token or bad user id', async () => {
            const { userId, token, provider, isSocial } = verifyToken;

            const cases = [
                {
                    query: `${BASE_PATH}/verify?userId=${userId}&token=${token}&provider=&isSocial=`,
                    errorType: BAD_REQUEST
                },
                {
                    query: `${BASE_PATH}/verify?userId=${userId}&token=ABCDGE&provider=${provider}&isSocial=${isSocial}`,
                    errorType: NOT_FOUND
                },
                {
                    query: `${BASE_PATH}/verify?userId=456&token=${token}&provider=${provider}&isSocial=${isSocial}`,
                    errorType: NOT_FOUND
                }
            ];

            let response;
            for (let i = 0; i < cases.length; i++) {
                const { query, errorType } = cases[i]
                const { code, statusCode } = errorType;

                response = await chai.request(server)
                    .get(query);

                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            }

        })
    });
});