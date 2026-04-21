const eventBus = require('../../../core/eventBus');
const { getIO } = require('../../../socketServer');
const { EVENTS } = require('../../../utils/constants');
const logger = require('../../../core/logger');

/**
 * Socket Subscriber
 * Bridges internal application events to WebSocket emissions
 */
const initializeSocketSubscribers = () => {
    try {
        const io = getIO();

        // Listen for Task events
        eventBus.subscribe(EVENTS.TASK_CREATED, (data) => {
            io.to(`org:${data.organizationId}`).emit('task_created', data);
            logger.debug(`Socket emit [task_created] to org:${data.organizationId}`);
        });

        eventBus.subscribe(EVENTS.TASK_UPDATED, (data) => {
            io.to(`org:${data.organizationId}`).emit('task_updated', data);
            logger.debug(`Socket emit [task_updated] to org:${data.organizationId}`);
        });

        eventBus.subscribe(EVENTS.TASK_DELETED, (data) => {
            io.to(`org:${data.organizationId}`).emit('task_deleted', { taskId: data.taskId });
            logger.debug(`Socket emit [task_deleted] to org:${data.organizationId}`);
        });

        logger.info('Socket Event Subscribers initialized.');
    } catch (err) {
        logger.error('Failed to initialize Socket Subscribers:', err);
    }
};

module.exports = initializeSocketSubscribers;
