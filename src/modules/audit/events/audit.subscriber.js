const eventBus = require('../../../core/eventBus');
const auditService = require('../services/audit.service');
const { EVENTS } = require('../../../utils/constants');
const logger = require('../../../core/logger');

// Subscribe to all critical events for auditing
const auditEvents = [
    EVENTS.TASK_CREATED,
    EVENTS.TASK_UPDATED,
    EVENTS.TASK_DELETED,
    EVENTS.TASK_STATUS_CHANGED,
    EVENTS.USER_LOGIN,
    EVENTS.APPROVAL_COMPLETED,
    EVENTS.SLA_BREACHED
];

auditEvents.forEach(eventType => {
    eventBus.subscribe(eventType, async (payload) => {
        try {
            await auditService.logAction({
                userId: payload.userId || payload.actorId,
                organizationId: payload.organizationId,
                action: eventType,
                module: payload.module || 'SYSTEM',
                entityId: payload.taskId || payload.entityId,
                newData: payload,
                timestamp: new Date()
            });
        } catch (error) {
            logger.error(`Audit subscriber error for ${eventType}:`, error);
        }
    });
});

logger.info('✅ Audit Subscriber initialized');
