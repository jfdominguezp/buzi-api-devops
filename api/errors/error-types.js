const ErrorTypes = {
    general: {
        MODEL_INVALID: {
            code: 'API-001',
            statusCode: 400,
            message: 'Invalid request body'
        },

        NOT_FOUND: {
            code: 'API-002',
            statusCode: 404,
            message: 'Resource not found'
        },

        UNEXPECTED_ERROR: {
            code: 'API-003',
            statusCode: 500,
            message: 'Unexpected error'
        },

        BAD_REQUEST: {
            code: 'API-004',
            statusCode: 400,
            message: 'Bad request body'
        }
    },

    auth: {
        GENERAL_AUTH_ERROR: {
            code: 'AUTH-001',
            statusCode: 500,
            message: 'Cannot signin with specified credentials'
        },
        
        INVALID_CREDENTIALS: {
            code: 'AUTH-002',
            statusCode: 401,
            message: 'Invalid credentials' 
        },

        BAD_TOKEN: {
            code: 'AUTH-003',
            statusCode: 400,
            message: 'Bad token'
        }, 

        FORBIDDEN: {
            code: 'AUTH-004',
            statusCode: 403,
            message: 'User is not allowed to access the specified resource'
        },

        INCORRECT_PASSWORD: {
            code: 'AUTH-005',
            statusCode: 401,
            message: 'Invalid password'
        }
    },

    db: {
        DB_ERROR: {
            code: 'DB-001',
            statusCode: 503,
            message: 'Error storing data in the DB'
        },

        VALIDATOR_ERROR: {
            code: 'DB-002',
            statusCode: 400,
            message: 'Model validation error'
        },

        DUPLICATE_KEY: {
            code: 'DB-003',
            statusCode: 400,
            message: 'Duplicate key error'
        }
    }
    
};

module.exports = ErrorTypes;