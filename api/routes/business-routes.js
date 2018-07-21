const express         = require('express');
const auth            = require('../auth/auth');
const wrapAsync       = require('../errors/wrap-async');
const { createError } = require('../errors/error-generator');
const ErrorTypes      = require('../errors/error-types');
const Business        = require('../models/business');
const router          = express.Router();

router.post('/branches', [auth.authenticateBusiness()], wrapAsync(addBranch))
      .put('/branches/:branchId', [auth.authenticateBusiness()], wrapAsync(updateBranch));

async function addBranch(request, response) {
    const { _id } = request.user;
    const branch = request.body;
    const business = await Business.addBranch(_id, branch);
    response.status(200).json(business);
}

async function updateBranch(request, response) {
    const { _id } = request.user;
    const { branchId } = request.params;
    const business = await Business.updateBranch(_id, branchId, request.body);
    response.status(200).json(business);
}

module.exports = router;
