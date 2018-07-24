const mocha             = require('mocha');
const chai              = require('chai');
const chaiHttp          = require('chai-http');
const should            = chai.should();
const server            = require('../../../server');
const seed              = require('./seed.json');
const ErrorTypes        = require('../../../api/errors/error-types');

const Member             = require('../../../api/models/member');
const Business           = require('../../../api/models/member');
const LocalUser          = require('../../../api/models/local-user');
const RefreshToken       = require('../../../api/models/refresh-token');
const VerifyToken        = require('../../../api/models/verify-token');
const Benefit            = require('../../../api/models/benefit');
const CustomerMembership = require('../../../api/models/customer-membership');

const { it, describe, before, after } = mocha;
const BASE_PATH = '/api/memberships/spendings';
const { NOT_FOUND, BAD_REQUEST } = ErrorTypes.general;

const { VALIDATOR_ERROR } = ErrorTypes.db;
const { business, member, spendingRewards } = seed;

//General variables
let authenticatedBusiness;
let addedRewards = [];

chai.use(chaiHttp);

describe ('Customer spendings', () => {
    before ('Clean; register business, member, spending rewards and set active rewards', async () => {
        await LocalUser.remove({});
        await RefreshToken.remove({});
        await VerifyToken.remove({});
        await Benefit.remove({});
        await Business.remove({});
        await Member.remove({});
        await CustomerMembership.remove({});

        await chai.request(server)
            .post('/api/auth/business/signup')
            .send(business);
 
        const { username, password } = business;

        const signinResponse = await chai.request(server)
            .post('/api/auth/business/signin')
            .send({ username, password });

        authenticatedBusiness = signinResponse.body;
        
        let rewardResponse = await chai.request(server)
            .post('/api/rewards')
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(spendingRewards[0]);

        addedRewards.push(rewardResponse.body);

        rewardResponse = await chai.request(server)
            .post('/api/rewards')
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(spendingRewards[1]);

        addedRewards.push(rewardResponse.body);

        rewardResponse = await chai.request(server)
            .post('/api/rewards')
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(spendingRewards[2]);

        addedRewards.push(rewardResponse.body);

        const [ first, second, third ] = addedRewards;

        const activeRewards = [
            { benefitId: first._id, goalAmount: 50000 },
            { benefitId: second._id, goalAmount: 65000 },
            { benefitId: third._id, goalAmount: 70000 }
        ];

        await chai.request(server)
            .put('/api/businesses/spendingrewards')
            .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
            .send(activeRewards);

        await chai.request(server)
            .post('/api/auth/signup')
            .send(member);
    });

    after ('Clean DB', async () => {
        await LocalUser.remove({});
        await RefreshToken.remove({});
        await VerifyToken.remove({});
        await Benefit.remove({});
        await Business.remove({});
        await Member.remove({});
        await CustomerMembership.remove({});
    });

    describe ('POST /api/memberships/spendings', () => {
        it ('it should register a spending that does not reach a reward goal', async () => {

            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send({ phone: member.phone, amount: 30000 });

            response.should.have.status(200);
            response.body.should.have.property('spendingTransactions').and.be.an('array').with.lengthOf(1);
            response.body.should.have.property('awardedBenefits').and.be.an('array').with.lengthOf(0);
        });

        it ('it should award a benefit when goal reached', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send({ phone: member.phone, amount: 30000 });

            response.should.have.status(200);
            response.body.should.have.property('spendingTransactions').and.be.an('array').with.lengthOf(3);
            response.body.spendingTransactions[2].type.should.equal('Debit');
            response.body.should.have.property('awardedBenefits').and.be.an('array').with.lengthOf(1);
        });

        it ('it should re-award benefits in order, if all already awarded', async () => {
            let response;
            for (let i = 0; i < 11; i++) {
                response = await chai.request(server)
                    .post(BASE_PATH)
                    .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                    .send({ phone: member.phone, amount: 30000 });
            }

            response.should.have.status(200);

            const { awardedBenefits } = response.body;
            awardedBenefits.should.be.an('array').with.lengthOf(6);
            awardedBenefits[0].benefitId.should.equal(awardedBenefits[3].benefitId);
            awardedBenefits[1].benefitId.should.equal(awardedBenefits[4].benefitId);
            awardedBenefits[2].benefitId.should.equal(awardedBenefits[5].benefitId);
        });

        it ('it should fail if incomplete', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send({ phone: member.phone });
            
            const { statusCode, code } = BAD_REQUEST;

            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });

        it ('it should fail if phone number does not exist', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send({ phone: '2345678', amount: 40000 });
            
            const { statusCode, code } = NOT_FOUND;

            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        });

        it ('it should fail if bad model', async () => {
            const response = await chai.request(server)
                .post(BASE_PATH)
                .set('Authorization', `Bearer ${authenticatedBusiness.tokens.accessToken}`)
                .send({ phone: member.phone, amount: 'Amount' });

            const { statusCode, code } = VALIDATOR_ERROR;

            response.should.have.status(statusCode);
            response.body.should.have.property('apiErrorCode').eql(code);
        })

    });
});