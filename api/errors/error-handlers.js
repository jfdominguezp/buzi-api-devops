const { MongoError }                 = require('mongodb');
const { createErrorAndSendResponse } = require('./error-generator');
const ErrorTypes                     = require('./error-types');

function handleErrors(error, request, response, next) {
    if (error.name && error.name === 'ValidationError') {
        return handleValidatorError(error, response);
    }
    if (error instanceof MongoError) {
        return handleDatabaseError(error, response);
    }
    if (error.apiErrorCode) {
        return handleApiError(error, response);
    }
    next(error);
}

function handleValidatorError(error, response) {
    const { message, errors } = error;
    return createErrorAndSendResponse(
        ErrorTypes.db.VALIDATOR_ERROR, 
        { message, errors },
        response
    );
}

function handleDatabaseError(error, response) {
    const { DUPLICATE_KEY, DB_ERROR } = ErrorTypes.db;
    const errorType = error.code === 11000 ? DUPLICATE_KEY : DB_ERROR;
    return createErrorAndSendResponse(
        errorType,
        error,
        response
    );
}

function handleApiError(error, response) {
    return response.status(error.statusCode).json(error);
}

module.exports = handleErrors;