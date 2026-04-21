const mongoose = require('mongoose');
const logger = require('../core/logger');
const { config } = require('./index');
const tenantGuardPlugin = require('../middlewares/tenantGuard');

let retryCount = 0;

const connectDB = async () => {
    try {
        // Register the zero-trust tenant guard plugin globally
        if (retryCount === 0) {
            mongoose.plugin(tenantGuardPlugin);
        }

        const conn = await mongoose.connect(config.mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
        retryCount = 0; // Reset count on success

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Mongoose will attempt automatic reconnection.');
        });

        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected.');
        });

        return conn;
    } catch (error) {
        retryCount++;
        const maxRetries = config.dbRetryAttempts || 5;
        const interval = config.dbRetryInterval || 5000;

        // Exponential backoff: interval * (2 ^ (retryCount - 1))
        const backoffTime = interval * Math.pow(2, retryCount - 1);

        if (retryCount <= maxRetries) {
            logger.warn(`MongoDB connection failed (Attempt ${retryCount}/${maxRetries}). Retrying in ${backoffTime / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return connectDB();
        } else {
            logger.error(`MongoDB connection failed after ${maxRetries} attempts: ${error.message}`);
            process.exit(1);
        }
    }
};

const disconnectDB = async () => {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully.');
};

module.exports = { connectDB, disconnectDB };
