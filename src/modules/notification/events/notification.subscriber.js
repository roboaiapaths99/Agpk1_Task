const eventBus = require('../../../core/eventBus');
const notificationService = require('../services/notification.service');
const logger = require('../../../core/logger');
const { EVENTS } = require('../../../utils/constants');

// Generic handler for common events
const subscribe = (event, handler) => {
    eventBus.subscribe(event, async (payload) => {
        try {
            await handler(payload);
        } catch (err) {
            logger.error(`Notification subscriber error for ${event}:`, err);
        }
    });
};

// Task Events
subscribe(EVENTS.TASK_CREATED, async (p) => {
    if (p.assignee && p.organizationId) {
        await notificationService.createNotification(p.assignee, p.organizationId, {
            title: 'New Task Assigned',
            message: `Task "${p.title}" has been assigned to you.`,
            category: 'task',
            type: 'info',
            link: `/tasks/${p.taskId}`,
            notifKey: 'taskAssigned',
        });
    }
});

subscribe(EVENTS.TASK_UPDATED, async (p) => {
    if (p.assignee && p.organizationId) {
        await notificationService.createNotification(p.assignee, p.organizationId, {
            title: 'Task Updated',
            message: `Task "${p.title}" was updated by ${p.updatedBy}.`,
            category: 'task',
            type: 'info',
            link: `/tasks/${p.taskId}`,
            notifKey: 'taskAssigned',
        });
    }
});

// Approval Events
subscribe(EVENTS.APPROVAL_REQUESTED, async (p) => {
    if (p.firstApprover && p.organizationId) {
        await notificationService.createNotification(p.firstApprover, p.organizationId, {
            title: 'Approval Required',
            message: `You have a new approval request for task ID: ${p.taskId}`,
            category: 'approval',
            type: 'warning',
            link: `/approvals/${p.requestId}`,
            notifKey: 'approvalRequired',
        });
    }
});

subscribe(EVENTS.APPROVAL_COMPLETED, async (p) => {
    if (p.requestedBy && p.organizationId) {
        await notificationService.createNotification(p.requestedBy, p.organizationId, {
            title: 'Approval Granted',
            message: `Your approval request for task ID: ${p.taskId} was approved.`,
            category: 'approval',
            type: 'success',
            notifKey: 'approvalRequired',
        });
    }
});

// SLA Events
subscribe(EVENTS.SLA_BREACHED, async (p) => {
    if (p.assignee && p.organizationId) {
        await notificationService.createNotification(p.assignee, p.organizationId, {
            title: 'SLA BREACH ALERT',
            message: `SLA deadline breached for task: ${p.title}`,
            type: 'error',
            category: 'system',
        });
    }
});

// Milestone Events
subscribe(EVENTS.MILESTONE_REACHED, async (p) => {
    if (p.owner && p.organizationId) {
        await notificationService.createNotification(p.owner, p.organizationId, {
            title: 'Milestone Completed',
            message: `Project ${p.projectName}: Milestone "${p.milestoneTitle}" reached.`,
            type: 'success',
            category: 'milestone',
        });
    }
});

logger.info('Notification Engine: Subscribers active');
