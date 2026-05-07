const { config, validateConfig } = require('./config');
const logger = require('./core/logger');
const { connectDB } = require('./config/database');
const { runMigrations } = require('./scripts/migrate');
const eventBus = require('./core/eventBus');
const EventLog = require('./core/EventLog');

const startServer = async () => {
    try {
        // 0. Validate Configuration
        validateConfig();

        // 1. Connect to MongoDB
        await connectDB();

        // 1.5 Run Database Migrations
        await runMigrations();

        // 2. Wire up EventLog model to EventBus for persistent logging
        eventBus.setEventLogModel(EventLog);

        // 3. Initialize event subscribers (all modules register their listeners)
        require('./modules/notification/events/notification.subscriber');
        require('./modules/audit/events/audit.subscriber');
        require('./modules/auto-task/events/autoTask.subscriber');
        require('./modules/automation/events/automation.subscriber');
        require('./modules/okr/events/okr.subscriber');
        require('./modules/finance/events/finance.subscriber');
        const initBudgetSubscriber = require('./modules/finance/budget/subscribers/budget.subscriber');
        initBudgetSubscriber();

        // 4. Import app after subscribers are registered
        // Background workers can be initialized here


        const app = require('./app');

        // 5. Start Express Server
        const PORT = config.port || 5000;
        const server = app.listen(PORT, () => {
            logger.info(`🚀 agpk1-task server running in ${config.nodeEnv} mode on port ${PORT}`);
        });

        // 6. Initialize Socket.io
        const { initSocket } = require('./socketServer');
        initSocket(server);

        // 7. Start Background Job System
        const jobScheduler = require('./core/jobScheduler');
        jobScheduler.init();

        // 8. Start Email Worker (BullMQ)
        const initializeEmailWorker = require('./workers/email.worker');
        initializeEmailWorker();

        // Graceful shutdown
        const shutdown = async (signal) => {
            logger.info(`${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                const { disconnectDB } = require('./config/database');
                await disconnectDB();
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled Rejection:', reason);
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
