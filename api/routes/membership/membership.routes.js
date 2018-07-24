const express            = require('express');
const auth               = require('../../auth/auth');
const wrapAsync          = require('../../errors/wrap-async');
const { createError }    = require('../../errors/error-generator');
const ErrorTypes         = require('../../errors/error-types');
const CustomerMembership = require('../../models/customer-membership');
const LocalUser          = require('../../models/local-user');
const Member             = require('../../models/member');
const router             = express.Router();

const { NOT_FOUND, BAD_REQUEST } = ErrorTypes.general;
const { GENERAL_AUTH_ERROR } = ErrorTypes.auth;

router.post('/spendings', [auth.authenticateBusiness()], wrapAsync(registerSpending));

async function registerSpending(request, response) {
    const { phone, amount } = request.body;
    const { _id } = request.user;

    if(!phone || !amount) throw createError(BAD_REQUEST, 'Incomplete fields.');
    const localUser = await LocalUser.findOne().byPhone(phone, 'People').select();
    if (!localUser) throw createError(NOT_FOUND, 'Member not found with the specified phone number');
    const member = await Member.findOne().byUserId(localUser._id);
    if (!member) throw createError(GENERAL_AUTH_ERROR, 'Corrupted user information');
    const registeredReward = await CustomerMembership.registerCustomerSpending(_id, member._id, amount);

    response.status(200).json(registeredReward);
}

module.exports = router;