const EventEmitter = require('events');
const crypto = require('crypto');
const logger = require('./logger');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50);
        this._eventLog = [];
        this._processedKeys = new Set();
        this._retryConfig = { maxRetries: 3, baseDelay: 1000 };
        this._EventLogModel = null;
    }

    /**
     * Set the Mongoose model for persistent event logging.
     * Called once after DB connection is ready.
     */
    setEventLogModel(model) {
        this._EventLogModel = model;
    }

    /**
     * Publish an event with payload and optional idempotency key.
     */
    async publish(eventName, payload = {}, idempotencyKey = null) {
        const key = idempotencyKey || crypto.randomUUID();

        // Idempotency check
        if (this._processedKeys.has(key)) {
            logger.warn(`Event already processed (idempotency key: ${key}), skipping: ${eventName}`);
            return null;
        }
        this._processedKeys.add(key);

        // Garbage-collect old keys (keep last 10000)
        if (this._processedKeys.size > 10000) {
            const toRemove = [...this._processedKeys].slice(0, 5000);
            toRemove.forEach((k) => this._processedKeys.delete(k));
        }

        const eventRecord = {
            eventId: key,
            eventName,
            payload,
            timestamp: new Date(),
            status: 'published',
        };

        // Persist to DB
        try {
            if (this._EventLogModel) {
                await this._EventLogModel.create(eventRecord);
            }
        } catch (err) {
            logger.error(`Failed to persist event log for ${eventName}:`, err);
        }

        logger.info(`Event published: ${eventName}`, { eventId: key });
        this.emit(eventName, payload, key);
        return key;
    }

    /**
     * Subscribe to an event with automatic retry on handler failure.
     */
    subscribe(eventName, handler, options = {}) {
        const { maxRetries, baseDelay } = { ...this._retryConfig, ...options };

        const wrappedHandler = async (payload, eventId) => {
            let attempt = 0;
            while (attempt <= maxRetries) {
                try {
                    await handler(payload, eventId);
                    logger.debug(`Event handled successfully: ${eventName}`, { eventId, attempt });
                    return;
                } catch (err) {
                    attempt++;
                    if (attempt > maxRetries) {
                        logger.error(`Event handler failed after ${maxRetries} retries: ${eventName}`, {
                            eventId,
                            error: err.message,
                        });
                        // Update event log status
                        try {
                            if (this._EventLogModel) {
                                await this._EventLogModel.findOneAndUpdate(
                                    { eventId },
                                    { status: 'failed', error: err.message }
                                );
                            }
                        } catch (logErr) {
                            logger.error('Failed to update event log on failure:', logErr);
                        }
                        return;
                    }
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    logger.warn(`Event handler retry ${attempt}/${maxRetries} for ${eventName} in ${delay}ms`, { eventId });
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        };

        this.on(eventName, wrappedHandler);
        logger.info(`Subscribed to event: ${eventName}`);
        return this;
    }

    /**
     * Get event history (from in-memory log).
     */
    getEventHistory(eventName = null, limit = 50) {
        // This would query DB in production, here we return from memory
        return this._eventLog.slice(-limit);
    }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
