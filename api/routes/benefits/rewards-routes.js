const express         = require('express');
const auth            = require('../../auth/auth');
const SpendingReward  = require('../../models/benefit-spending-reward');
const wrapAsync       = require('../../errors/wrap-async');
const { createError } = require('../../errors/error-generator');
const { general }     = require('../../errors/error-types');
const router          = express.Router();

router
    .get('/', [auth.authenticateBusiness()], wrapAsync(getRewards))
    .post('/', [auth.authenticateBusiness()], wrapAsync(insertReward))
    .get('/:id', wrapAsync(getRewardById))
    .put('/:id', [auth.authenticateBusiness()], wrapAsync(updateReward));

async function insertReward(request, response) {
    const reward = new SpendingReward(request.body);
    reward.businessId = request.user._id;
    const savedReward = await reward.save();
    response.status(200).json(savedReward);
}

async function getRewards(request, response) {
    const rewards = await SpendingReward.find({ businessId: request.user._id });
    response.status(200).json(rewards);
}

async function getRewardById(request, response) {
    const reward = await SpendingReward.findById(request.params.id);
    if (!reward) throw createError(general.NOT_FOUND, 'Reward not found');
    response.status(200).json(reward);
}

async function updateReward(request, response) {
    const _id = request.params.id;
    const businessId = request.user._id;
    const body = request.body;
    const query = { _id, businessId };
    const options = { new: true, runValidators: true };

    const updated = await SpendingReward.findOneAndUpdate(query, body, options).exec();

    if (!updated) throw createError(general.NOT_FOUND, 'Reward not found for specified business');
    response.status(200).json(updated);
}

module.exports = router;