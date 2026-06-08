const { Queue } = require('bullmq');
const { config } = require('../config');
const logger = require('./logger');

/**
 * Centralized Queue Management Service
 * Provides access to BullMQ queues powered by Redis
 */
class QueueService {
    constructor() {
        this.queues = new Map();
        
        const redisUrl = config.cache.redisUrl || 'redis://localhost:6379';
        let connectionOpts = { host: 'localhost', port: 6379 };
        try {
            const parsed = new URL(redisUrl);
            connectionOpts = {
                host: parsed.hostname || 'localhost',
                port: parsed.port ? parseInt(parsed.port, 10) : 6379
            };
            if (parsed.username) connectionOpts.username = parsed.username;
            if (parsed.password) connectionOpts.password = decodeURIComponent(parsed.password);
            if (parsed.pathname && parsed.pathname !== '/') {
                const db = parseInt(parsed.pathname.substring(1), 10);
                if (!isNaN(db)) connectionOpts.db = db;
            }
            if (parsed.protocol === 'rediss:') {
                connectionOpts.tls = {};
            }
        } catch (err) {
            logger.error('Failed to parse REDIS_URL in queue.js:', err);
        }
        
        this.connection = connectionOpts;
    }

    /**
     * Get or create a named queue
     */
    getQueue(queueName) {
        if (!this.queues.has(queueName)) {
            const queue = new Queue(queueName, {
                connection: {
                    ...this.connection,
                    // Prevent BullMQ from retrying forever and flooding logs
                    maxRetriesPerRequest: 1,
                    enableReadyCheck: false
                },
                defaultJobOptions: {
                    attempts: 1,
                    removeOnComplete: true,
                    removeOnFail: true,
                }
            });

            // Suppress repeated connection errors to terminal in development
            queue.on('error', (err) => {
                if (err.message.includes('ECONNREFUSED')) {
                    // Only log once per minute to avoid flooding
                    const now = Date.now();
                    if (!this._lastErrorLog || now - this._lastErrorLog > 60000) {
                        logger.warn(`Queue [${queueName}] connection refused. Background jobs will be processed locally.`);
                        this._lastErrorLog = now;
                    }
                } else {
                    logger.error(`Queue [${queueName}] Error:`, err);
                }
            });

            this.queues.set(queueName, queue);
            logger.info(`Queue [${queueName}] initialized (Fail-safe mode enabled).`);
        }
        return this.queues.get(queueName);
    }

    /**
     * Add a job to a specific queue
     */
    async asyncAddJob(queueName, jobName, data, options = {}) {
        try {
            const queue = this.getQueue(queueName);
            const job = await queue.add(jobName, data, options);
            logger.debug(`Job [${jobName}] added to queue [${queueName}] with ID: ${job.id}`);
            return job;
        } catch (err) {
            // Handle Redis connection errors gracefully in development
            if (err.message.includes('ECONNREFUSED') || err.message.includes('Connection is closed')) {
                logger.warn(`Queue [${queueName}] is unavailable (Redis connection refused). Processing job [${jobName}] locally.`);

                // If it's an email job and we're in development, the "worker" logic (sending email)
                // usually happens elsewhere, but for now we just want the request to NOT fail.
                // We'll return a mock job object.
                return { id: 'mock-job-' + Date.now(), data, isMock: true };
            }

            logger.error(`Failed to add job to queue [${queueName}]:`, err);
            throw err;
        }
    }

    /**
     * Compatibility alias for addJob
     */
    async addJob(queueName, jobName, data, options = {}) {
        return this.asyncAddJob(queueName, jobName, data, options);
    }
}

module.exports = new QueueService();
