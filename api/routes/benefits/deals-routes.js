const express         = require('express');
const auth            = require('../../auth/auth');
const Deal            = require('../../models/benefit-deal');
const wrapAsync       = require('../../errors/wrap-async');
const { createError } = require('../../errors/error-generator');
const { general }     = require('../../errors/error-types');
const router          = express.Router();

router
    .get('/', [auth.authenticateBusiness()], wrapAsync(getDeals))
    .post('/', [auth.authenticateBusiness()], wrapAsync(insertDeal))
    .get('/:id', wrapAsync(getDealById))
    .put('/:id', [auth.authenticateBusiness()], wrapAsync(updateDeal));

async function insertDeal(request, response) {
    const deal = new Deal(request.body);
    deal.businessId = request.user._id;
    const savedDeal = await deal.save();
    response.status(200).json(savedDeal);
}

async function getDeals(request, response) {
    const deals = await Deal.find({ businessId: request.user._id });
    response.status(200).json(deals);
}

async function getDealById(request, response) {
    const deal = await Deal.findById(request.params.id);
    if (!deal) throw createError(general.NOT_FOUND, 'Deal not found');
    response.status(200).json(deal);
}

async function updateDeal(request, response) {
    const _id = request.params.id;
    const businessId = request.user._id;
    const body = request.body;
    const query = { _id, businessId };

    const options = { new: true, runValidators: true };
    
    const updated = await Deal.findOneAndUpdate(query, body, options).exec();
    if (!updated) throw createError(general.NOT_FOUND, 'Deal not found for specified business');
    
    response.status(200).json(updated);
}

module.exports = router;