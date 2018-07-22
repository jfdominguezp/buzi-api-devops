const express         = require('express');
const auth            = require('../../auth/auth');
const wrapAsync       = require('../../errors/wrap-async');
const { createError } = require('../../errors/error-generator');
const { general }     = require('../../errors/error-types');
const Business        = require('../../models/business');
const SpendingReward  = require('../../models/benefit-spending-reward');
const router          = express.Router();

const { NOT_FOUND, BAD_REQUEST } = general;

router.put('/', [auth.authenticateBusiness()], wrapAsync(setActiveSpendingRewards));

async function setActiveSpendingRewards(request, response) {
    const rewards = request.body;
    if (!Array.isArray(rewards)) throw createError(BAD_REQUEST, 'Rewards should be in an array');
    const ids = rewards.map(reward => reward.benefitId);
    const allFound = await SpendingReward.allFound(ids, { businessId: request.user._id });
    if (!allFound) throw createError(NOT_FOUND, 'Not all reward ids were found');
    const business = await Business.setActiveSpendingRewards(request.user._id, rewards);
    response.status(200).json(business);
}

module.exports = router;