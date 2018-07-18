process.env.NODE_ENV = 'test';

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
let business;

chai.use(chaiHttp);

describe('Business Auth', () => {
    beforeEach('clean businesses and local users', async () => {
        await Business.remove({});
        await LocalUser.remove({});
        business = Object.assign({ }, seed.business);
    });

    describe('POST /api/auth/business/signup', () => {
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

            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(400);
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

            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(400);
            response.body.should.have.property('apiErrorCode').eql(db.VALIDATOR_ERROR.code);
        });

        it ('it should not create a business with bad structure', async () => {
            business.contactData = "Contact data";
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(400);
            response.body.should.have.property('apiErrorCode').eql(db.VALIDATOR_ERROR.code);
        });

        it ('it should not create a business user with an already existing email or username', async () => {
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(200);
            response.body.should.have.property('userId');

            const resend = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);

            resend.should.have.status(400);
            resend.body.should.have.property('apiErrorCode').eql(db.DUPLICATE_KEY.code);
        });
    });
});