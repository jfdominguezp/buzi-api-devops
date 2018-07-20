const express        = require('express');
const auth           = require('../../auth/auth');
const SpendingReward = require('../../models/benefit-spending-reward');
const wrapAsync      = require('../../errors/wrap-async');
const router         = express.Router();

router.post('/', [auth.authenticateBusiness()], wrapAsync(postReward));

async function postReward (request, response) {
    const reward = new SpendingReward(request.body);
    reward.businessId = request.user._id;
    const savedReward = await reward.save();
    response.status(200).json(savedReward);
}

module.exports = router;