const SLAPolicy = require('../models/SLAPolicy');
const Task = require('../models/Task');
const logger = require('../../../core/logger');

class SLAService {
    /**
     * Applies SLA policies to a task based on its priority and organization.
     * @param {Object} task The task object
     */
    async applySLA(task) {
        try {
            const policy = await SLAPolicy.findOne({
                priority: task.priority,
                organizationId: task.organizationId,
                isActive: true
            });

            if (!policy) {
                logger.debug(`No active SLA policy found for priority ${task.priority} in org ${task.organizationId}`);
                return;
            }

            const now = new Date();
            const slaDeadline = new Date(now.getTime() + policy.resolutionTimeLimit * 60 * 60 * 1000);

            task.slaDeadline = slaDeadline;
            task.slaApplied = true;
            task.slaBreached = false;

            await task.save();
            logger.info(`Applied SLA Policy "${policy.name}" to task ${task._id}. Deadline: ${slaDeadline}`);
        } catch (error) {
            logger.error(`Error applying SLA to task ${task._id}:`, error);
        }
    }

    /**
     * Checks all active tasks for SLA breaches.
     * This is intended to be run by the job scheduler.
     */
    async checkBreaches() {
        const now = new Date();
        try {
            const potentialBreaches = await Task.find({
                status: { $nin: ['completed', 'cancelled'] },
                slaDeadline: { $lt: now },
                slaBreached: false,
                slaApplied: true
            });

            for (const task of potentialBreaches) {
                task.slaBreached = true;
                await task.save();

                // Trigger escalation / notification
                // This will be picked up by the eventBus in jobScheduler or we can emit here
                logger.warn(`SLA Breach detected for task ${task._id} (${task.title})`);
            }

            return potentialBreaches.length;
        } catch (error) {
            logger.error('Error checking SLA breaches:', error);
            throw error;
        }
    }
}

module.exports = new SLAService();
