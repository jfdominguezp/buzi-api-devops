const express  = require('express');
const Benefit = require('../models/benefit');
const Deal = require('../models/benefit-deal');
const SpendingReward = require('../models/benefit-spending-reward');
const BusinessCustomer = require('../models/business-customer');
const CustomerEvent = require('../models/customer-event');
const Transaction = require('../models/transaction');
const SpendingTransaction = require('../models/spending-transaction');

const router   = express.Router();

module.exports = router;

