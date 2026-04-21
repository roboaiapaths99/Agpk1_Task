const cacheService = require('../core/cache');

/**
 * Cache Middleware to intercept GET requests
 * Key is generated from URL and User Organization to ensure multi-tenant security
 */
const cacheMiddleware = (ttl = 3600) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const orgId = req.user?.organizationId?._id || req.user?.organizationId || 'global';
        const key = `cache:${orgId}:${req.originalUrl || req.url}`;

        try {
            const cachedData = await cacheService.get(key);
            if (cachedData) {
                res.set('X-Cache', 'HIT');
                return res.json(cachedData);
            }

            // Patch res.json to capture response and store in cache
            const originalJson = res.json;
            res.json = function (data) {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cacheService.set(key, data, ttl);
                }
                res.set('X-Cache', 'MISS');
                return originalJson.call(this, data);
            };

            next();
        } catch (error) {
            // If cache fails, continue to next middleware/controller silently
            next();
        }
    };
};

module.exports = { cacheMiddleware };
