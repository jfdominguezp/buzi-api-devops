const createError = ({ code, statusCode, message }, error = {}) => {
    return {
        statusCode,
        message,
        apiErrorCode: code,
        fullError: error
    };
};

const createErrorAndSendResponse = ({ code, statusCode, message }, error = { }, response) => {
    const resError = createError({ code, statusCode, message }, error);
    return response.status(statusCode).json(resError);
}

module.exports = { createError, createErrorAndSendResponse };