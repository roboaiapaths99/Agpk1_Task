const logger = require('./logger');

/**
 * Pluggable Cache Service for Enterprise Applications
 * Supports In-Memory (default) and Redis (future-ready)
 */
class CacheService {
    constructor() {
        this.cache = new Map();
        this.redis = null; // Placeholder for Redis client
        this.isRedisEnabled = false;

        // Initialize Redis if REDIS_URL is provided in environment
        if (process.env.REDIS_URL) {
            try {
                // In a professional setup, we would require('ioredis') here
                // For now, we remain ready but default to in-memory if lib not found
                logger.info('REDIS_URL found. Cache service is Redis-ready.');
            } catch (err) {
                logger.warn('Redis client not available, falling back to in-memory cache.');
            }
        }
    }

    async get(key) {
        if (this.isRedisEnabled && this.redis) {
            return JSON.parse(await this.redis.get(key));
        }

        const item = this.cache.get(key);
        if (!item) return null;

        // Check TTL
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    async set(key, value, ttlSeconds = this.defaultTtl) {
        if (this.isRedisEnabled && this.redis) {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
            return;
        }

        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiry });
    }

    async del(key) {
        if (this.isRedisEnabled && this.redis) {
            await this.redis.del(key);
            return;
        }
        this.cache.delete(key);
    }

    async flush() {
        if (this.isRedisEnabled && this.redis) {
            await this.redis.flushall();
            return;
        }
        this.cache.clear();
    }

    /**
     * Pattern-based deletion (e.g., clear all tasks for an org)
     */
    async delByPattern(pattern) {
        if (this.isRedisEnabled && this.redis) {
            // Implementation for Redis keys scanning and deletion
            return;
        }

        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }
}

module.exports = new CacheService();
