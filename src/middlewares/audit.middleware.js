const AuditLog = require('../modules/audit/models/AuditLog');
const logger = require('../core/logger');
const crypto = require('crypto');

/**
 * Middleware to translate HTTP mutations into Audit Logs
 * Captures request context and persists after response completion
 */
const auditMiddleware = (options = {}) => {
    return (req, res, next) => {
        // Only log mutations (POST, PUT, PATCH, DELETE)
        const methodsToLog = ['POST', 'PUT', 'PATCH', 'DELETE'];
        if (!methodsToLog.includes(req.method)) {
            return next();
        }

        // Exclusion list (e.g., login passwords, sensitive internal health checks)
        const excludedPaths = ['/auth/login', '/auth/register'];
        if (excludedPaths.some(path => req.path.includes(path))) {
            return next();
        }

        const originalJson = res.json;

        // Intercept response to log success/failure
        res.json = function (data) {
            res.json = originalJson; // Restore original function

            // Log asynchronously after response is sent
            process.nextTick(async () => {
                try {
                    // Only log if user and org context is available (meaning request is authenticated)
                    if (req.user && req.user.organizationId) {
                        const pathSegments = req.path.split('/').filter(Boolean);
                        const module = pathSegments[0] || 'system';
                        const action = `${req.method}_${pathSegments[1]?.toUpperCase() || 'ACTION'}`;
                        const entityType = module.charAt(0).toUpperCase() + module.slice(1).replace(/s$/, '');

                        const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
                        const userAgent = req.headers['user-agent'];
                        const newData = req.method !== 'DELETE' ? req.body : undefined;
                        const userId = req.user.id || req.user._id;
                        const orgId = req.user.organizationId?._id || req.user.organizationId;
                        const timestamp = new Date();

                        // Chained Hashing for Integrity
                        const lastLog = await AuditLog.findOne({ organizationId: orgId }).sort({ timestamp: -1 });
                        const previousHash = lastLog ? lastLog.hash : 'ORIGIN_HASH';

                        const logPayload = {
                            userId,
                            organizationId: orgId,
                            action,
                            module,
                            status: res.statusCode < 400 ? 'success' : 'failure',
                            entityType,
                            entityId: req.params.id || data?.id || data?._id || data?.task?._id || null,
                            newData,
                            ipAddress,
                            userAgent,
                            timestamp,
                            previousHash
                        };

                        const hash = crypto.createHash('sha256')
                            .update(JSON.stringify(logPayload))
                            .digest('hex');

                        await AuditLog.create({
                            ...logPayload,
                            hash
                        });
                    }
                } catch (err) {
                    logger.error('Failed to save audit log:', err);
                }
            });

            return originalJson.call(this, data);
        };

        next();
    };
};

module.exports = { auditMiddleware };
