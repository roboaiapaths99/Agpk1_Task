const { ValidationError } = require('../core/errors');

/**
 * Joi Validation Middleware Factory
 * @param {Object} schema - Joi schema object
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = req[source];
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false,
        });

        if (error) {
            const errorMessages = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, ''),
            }));
            return next(new ValidationError('Validation failed', errorMessages));
        }

        // Replace with validated & sanitized data
        req[source] = value;
        next();
    };
};

module.exports = { validate };
