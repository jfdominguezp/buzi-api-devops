const mocha                 = require('mocha');
const chai                  = require('chai');
const chaiHttp              = require('chai-http');
const should                = chai.should();
const server                = require('../../../server');
const seed                  = require('./seed.json');
const { auth, db, general } = require('../../../api/errors/error-types');

const Member       = require('../../../api/models/member');
const LocalUser    = require('../../../api/models/local-user');
const RefreshToken = require('../../../api/models/refresh-token');
const VerifyToken  = require('../../../api/models/verify-token');

const { it, describe, beforeEach } = mocha;
const BASE_PATH = '/api/auth';

chai.use(chaiHttp);

describe('Auth common', () => {
    
})