const logger = require('../core/logger');
const { config } = require('../config');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = err.errors || null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    } else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0];
        message = `Duplicate value for field: ${field}`;
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid field: ${err.path}`;
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired. Please log in again.';
    }

    // Security: Hide 500 implementation details in production
    if (statusCode === 500 && config.isProduction) {
        message = 'Something went wrong on our end';
    }

    // Log the error
    const logData = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        ...(errors && { errors }),
        ...(statusCode === 500 && { stack: err.stack }),
    };

    if (statusCode >= 500) {
        logger.error(`${statusCode} - ${message}`, logData);
    } else {
        logger.warn(`${statusCode} - ${message}`, logData);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(errors && { errors }),
        ...(config.isDevelopment && { stack: err.stack }),
    });
};

/**
 * 404 Not Found handler for undefined routes
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

module.exports = { errorHandler, notFoundHandler };
