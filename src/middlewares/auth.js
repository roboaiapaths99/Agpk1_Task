const jwt = require('jsonwebtoken');
const { config } = require('../config');
const { UnauthorizedError } = require('../core/errors');
const { tenantStorage } = require('./tenantContext');

/**
 * JWT Authentication Middleware
 * Extracts token from Authorization header and verifies it.
 * Attaches decoded user to req.user
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided. Authorization header must be: Bearer <token>');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new UnauthorizedError('Malformed authorization header');
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || [],
            name: decoded.name,
            organizationId: decoded.organizationId,
        };

        // Wrap the rest of the request chain in the tenant context
        return tenantStorage.run({ organizationId: req.user.organizationId }, () => next());
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new UnauthorizedError('Invalid token'));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Token expired'));
        }
        next(error);
    }
};

/**
 * Optional auth — does not fail if no token, just sets req.user to null
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return tenantStorage.run({ organizationId: null }, () => next());
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            permissions: decoded.permissions || [],
            name: decoded.name,
            organizationId: decoded.organizationId
        };
        return tenantStorage.run({ organizationId: req.user.organizationId }, () => next());
    } catch {
        req.user = null;
        return tenantStorage.run({ organizationId: null }, () => next());
    }
};

module.exports = { authenticate, optionalAuth };
