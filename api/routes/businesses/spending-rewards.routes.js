const express         = require('express');
const auth            = require('../../auth/auth');
const wrapAsync       = require('../../errors/wrap-async');
const { createError } = require('../../errors/error-generator');
const { general }     = require('../../errors/error-types');
const SpendingReward  = require('../../models/benefit-spending-reward');
const router          = express.Router();

const { NOT_FOUND, BAD_REQUEST } = general;

router.put('/', [auth.authenticateBusiness()], wrapAsync(setActiveSpendingRewards));

async function setActiveSpendingRewards(request, response) {
    const rewards = request.body;
    if (!Array.isArray(rewards)) throw createError(BAD_REQUEST, 'Rewards should be in an array');

    const business = request.user;

    const ids = rewards.map(reward => reward.benefitId);
    const allFound = await SpendingReward.allFound(ids, { businessId: business._id });
    if (!allFound) throw createError(NOT_FOUND, 'Not all reward ids were found');

    business.activeSpendingRewards = rewards;
    const savedBusiness = await business.save();
    delete savedBusiness.identities;
    response.status(200).json(savedBusiness);
}

module.exports = router;