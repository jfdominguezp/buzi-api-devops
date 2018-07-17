process.env.NODE_ENV = 'test';

const mocha      = require('mocha');
const chai       = require('chai');
const chaiHttp   = require('chai-http');
const should     = chai.should();
const server     = require('../../../server');
const seed       = require('./seed.json');

const LocalUser = require('../../../api/models/local-user');
const Business  = require('../../../api/models/business');

const { it, describe, beforeEach } = mocha;
const BASE_PATH = '/api/auth/business';

chai.use(chaiHttp);

describe('Business Auth', () => {
    beforeEach('clean businesses and local users', async () => {
        await Business.remove({});
        await LocalUser.remove({});
    });

    describe('POST /api/auth/business/signup', () => {
        it ('it should create a business user and login it', async () => {
            const response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(seed.business);
            
            response.should.have.status(200);
            response.body.should.be.a('object');
            response.body.should.have.property('userId');
            response.body.should.have.property('data');
            response.body.data.should.have.property('name').eql(seed.business.name);
            response.body.should.have.property('tokens');
            response.body.tokens.should.have.property('accessToken');
            response.body.tokens.should.have.property('refreshToken');
        });

        it ('it should not create a business with invalid email', async () => {
            let business = seed.business;
            business.email = 'test@test';

            let response = await chai.request(server)
                .post(`${BASE_PATH}/signup`)
                .send(business);
            response.should.have.status(400);
        });
    });
});