const eventBus = require('../../../core/eventBus');
const okrService = require('../services/okr.service');
const KeyResult = require('../models/KeyResult');
const logger = require('../../../core/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * OKR Event Subscriber
 * Listens for system events and triggers OKR progress recalculations.
 */

// Subscribe to task status changes
eventBus.subscribe(EVENTS.TASK_STATUS_CHANGED, async (payload) => {
    try {
        const { taskId, organizationId } = payload;

        // Find all Key Results that link to this task
        const linkedKRs = await KeyResult.find({
            linkedTasks: taskId,
            organizationId
        });

        if (linkedKRs.length === 0) return;

        logger.info(`OKR Engine: Task ${taskId} status changed. Recalculating ${linkedKRs.length} Key Results.`);

        // Recalculate each impacted Key Result
        for (const kr of linkedKRs) {
            await okrService.recalculateKRFromTasks(kr._id, organizationId);
        }
    } catch (err) {
        logger.error('OKR Subscriber error:', err);
    }
});

// Subscribe to task assignment/updates if needed
eventBus.subscribe(EVENTS.TASK_UPDATED, async (payload) => {
    // Similar logic if relevant (e.g. if we track non-status updates that affect progress)
    // For now, status changes are the primary trigger for progress.
});

logger.info('OKR Engine: Subscribers active');
