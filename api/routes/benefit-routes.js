const express  = require('express');
const Deal = require('../models/benefit-deal');
const SpendingReward = require('../models/benefit-spending-reward');
const router   = express.Router();

router
    .post('/deals', postDeal)
    .post('/rewards', postReward);

async function postDeal(request, response) {
    const deal = new Deal(request.body);
    try {
        const newDeal = await deal.save();
        response.status(200).json(newDeal);
    } catch (error) {
        response.status(400).json(error);
    }
}

async function postReward(request, response) {
    const reward = new SpendingReward(request.body);
    try {
        const newReward = await reward.save();
        response.status(200).json(newReward);
    } catch (error) {
        response.status(400).json(error);
    }
}

module.exports = router;

