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
        },

        RESET_TOKEN_USED: {
            code: 'AUTH-006',
            statusCode: 403,
            message: 'Reset token already used'
        },

        BAD_REFRESH_TOKEN: {
            code: 'AUTH-007',
            statusCode: 401,
            message: 'Bad refresh token'
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
        },

        CAST_ERROR: {
            code: 'DB-004',
            statusCode: 400,
            message: 'Bad request. Error converting a property or param.'
        }
    },

    rewards: {
        NO_REWARDS_PROGRAM: {
            code: 'RW-001',
            statusCode: 400,
            message: 'No rewards program created'
        }
    }
    
};

module.exports = ErrorTypes;