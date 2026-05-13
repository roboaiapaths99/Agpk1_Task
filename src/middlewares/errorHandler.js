const logger = require('../core/logger');
const { config } = require('../config');

/**
 * Maps technical error messages to user-friendly messages.
 * This ensures no backend implementation details leak to the frontend.
 */
const USER_FRIENDLY_MESSAGES = {
    400: 'The request contains invalid data. Please check your input and try again.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested item could not be found.',
    409: 'This item already exists or conflicts with existing data.',
    422: 'Unable to process the request. Please verify the information provided.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'An unexpected error occurred. Please try again later.',
};

/**
 * Global Error Handler Middleware
 * Returns user-friendly messages to the frontend while logging full details server-side.
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let userMessage = '';
    let errors = null;

    // Handle specific error types and map to friendly messages
    if (err.name === 'ValidationError' && err.errors) {
        // Custom app ValidationError (from Joi)
        statusCode = 400;
        userMessage = 'Please check your input and correct the highlighted fields.';
        errors = Array.isArray(err.errors) ? err.errors.map((e) => ({
            field: e.field || e.path,
            message: e.message?.replace(/"/g, '') || 'Invalid value',
        })) : null;
    } else if (err.name === 'ValidationError' && !err.statusCode) {
        // Mongoose ValidationError
        statusCode = 400;
        userMessage = 'Some fields contain invalid values. Please review and try again.';
        errors = Object.values(err.errors || {}).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    } else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0];
        userMessage = field
            ? `A record with this ${field} already exists. Please use a different value.`
            : 'This item already exists.';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        userMessage = 'The request contains an invalid value. Please check and try again.';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        userMessage = 'Your session is invalid. Please log in again.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        userMessage = 'Your session has expired. Please log in again.';
    } else if (statusCode === 403) {
        userMessage = 'You do not have permission to perform this action. Please contact your administrator.';
    } else if (statusCode === 404) {
        userMessage = err.message?.includes('not found')
            ? err.message
            : 'The requested item could not be found.';
    } else if (statusCode >= 500) {
        userMessage = 'An unexpected error occurred. Please try again later or contact support.';
    } else {
        // For other 4xx errors, use the error message if it looks safe, otherwise use generic
        userMessage = USER_FRIENDLY_MESSAGES[statusCode] || err.message || 'Something went wrong. Please try again.';
    }

    // Log the FULL error details server-side for debugging
    const logData = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        statusCode,
        originalMessage: err.message,
        ...(errors && { errors }),
        ...(statusCode >= 500 && { stack: err.stack }),
    };

    if (statusCode >= 500) {
        logger.error(`${statusCode} - ${err.message}`, logData);
    } else {
        logger.warn(`${statusCode} - ${err.message}`, logData);
    }

    // Send clean, user-friendly response to the frontend
    res.status(statusCode).json({
        success: false,
        message: userMessage,
        ...(errors && { errors }),
    });
};

/**
 * 404 Not Found handler for undefined routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'The page or resource you are looking for does not exist.',
    });
};

module.exports = { errorHandler, notFoundHandler };
