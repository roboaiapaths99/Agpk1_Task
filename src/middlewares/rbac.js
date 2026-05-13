const { ForbiddenError } = require('../core/errors');

/**
 * Role-Based Access Control Middleware
 * Usage: authorize('admin', 'manager')
 * Checks if req.user.role is in the allowed roles list.
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('User not authenticated'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError(`Role '${req.user.role}' is not authorized to access this resource`));
        }
        next();
    };
};

/**
 * Permission-based access check (future-ready)
 * Usage: requirePermission('tasks:create')
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('User not authenticated'));
        }

        // Admins have all permissions (Superuser bypass)
        const userRole = String(req.user.role || '').toLowerCase();
        if (userRole === 'admin') {
            return next();
        }

        // Check if user has the specific permission
        const hasPermission = req.user.permissions && req.user.permissions.includes(permission);

        if (!hasPermission) {
            console.warn(`[RBAC] Permission denied: user=${req.user.id}, role=${req.user.role}, required=${permission}`);
            return next(new ForbiddenError(`Permission '${permission}' is required for this resource`));
        }

        next();
    };
};

module.exports = { authorize, requirePermission };
