const mocha                 = require('mocha');
const chai                  = require('chai');
const chaiHttp              = require('chai-http');
const jwt                   = require('jsonwebtoken');
const should                = chai.should();
const server                = require('../../../server');
const seed                  = require('./seed.json');
const wrapAsync             = require('../../../api/errors/wrap-async');
const { auth, db, general } = require('../../../api/errors/error-types');

const Member       = require('../../../api/models/member');
const LocalUser    = require('../../../api/models/local-user');
const RefreshToken = require('../../../api/models/refresh-token');
const VerifyToken  = require('../../../api/models/verify-token');

const { it, describe, beforeEach } = mocha;
const BASE_PATH = '/api/auth';

chai.use(chaiHttp);

//General variables
let member;
let signinResponse;

describe('Auth common', () => {
    describe('POST /api/auth/token', () => {
        /**
         * We use the member schema because is the easiest one. This
         * test is focused on LocalUser. In other test sets, we evaluate
         * if inserting a member or a business also inserts a local user.
         */
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
            const { BAD_REQUEST, NOT_FOUND } = general;
            const { BAD_REFRESH_TOKEN } = auth;

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
            cases.forEach(async ({ payload, errorType }) => {
                const { code, statusCode } = errorType;
                response = await chai.request(server)
                    .post(`${BASE_PATH}/token`)
                    .send(payload);             
                response.should.have.status(statusCode);
                response.body.should.have.property('apiErrorCode').eql(code);
            });
        });
    });
});