const cron = require('node-cron');
const logger = require('../core/logger');
const taskService = require('../modules/work-item/services/task.service');
const Task = require('../modules/work-item/models/Task');
const recurringService = require('../modules/recurring/services/recurring.service');
const eventBus = require('../core/eventBus');
const { EVENTS } = require('../utils/constants');

class JobScheduler {
    init() {
        logger.info('Initializing Background Job System...');

        // 1. Process Recurring Task Generation (Every hour)
        cron.schedule('0 * * * *', async () => {
            logger.info('JOB triggered: Processing Recurring Tasks');
            try { await recurringService.processRecurringTasks(); }
            catch (err) { logger.error('Recurring Task Job Failed:', err); }
        });

        // 2. Check Overdue Tasks (Every midnight)
        cron.schedule('0 0 * * *', async () => {
            logger.info('JOB triggered: Checking Overdue Tasks');
            try {
                const overdue = await Task.find({ status: { $ne: 'completed' }, dueDate: { $lt: new Date() } });
                for (const task of overdue) {
                    await eventBus.publish(EVENTS.TASK_OVERDUE, {
                        taskId: task._id,
                        title: task.title,
                        assignee: task.assignee,
                        organizationId: task.organizationId
                    });
                }
            } catch (err) { logger.error('Overdue Check Job Failed:', err); }
        });

        // 3. SLA Breach Monitoring (Every 15 minutes)
        cron.schedule('*/15 * * * *', async () => {
            logger.info('JOB triggered: Checking SLA Breaches');
            try {
                const slaService = require('../modules/work-item/services/sla.service');
                const breachCount = await slaService.checkBreaches();
                if (breachCount > 0) {
                    logger.warn(`SLA Job: Detected and marked ${breachCount} breaches.`);
                }
            } catch (err) { logger.error('SLA Breach Job Failed:', err); }
        });

        // 4. Daily Digest Notification (Every morning 8 AM)
        cron.schedule('0 8 * * *', async () => {
            logger.info('JOB triggered: Sending Daily Digests');
            // Logic would involve grouping unread notifications or tasks due today
            await eventBus.publish('SYSTEM_DAILY_DIGEST', { timestamp: new Date() });
        });

        // 5. Finance: Daily Payment Reminders (9 AM)
        cron.schedule('0 1 * * *', async () => {
            console.log('Running nightly financial report generation...');
            // await ReportService.generateNightlyReport();
        });

        // Process Recurring Finance Templates at 2 AM
        cron.schedule('0 2 * * *', async () => {
            logger.info('Processing Recurring Finance Templates...');
            try {
                const RecurringFinanceService = require('../modules/finance/recurring/services/recurring.service');
                await RecurringFinanceService.processPendingTemplates();
            } catch (err) {
                logger.error('Recurring Finance Job Failed:', err);
            }
        });

        // 6. Finance: Nightly Report Generation (Midnight)
        cron.schedule('0 0 * * *', async () => {
            logger.info('JOB triggered: Finance Nightly Reports');
            // Future: nightly report generation logic
        });

        // 7. Finance: Daily Dunning Automation (4 AM)
        cron.schedule('0 4 * * *', async () => {
            logger.info('JOB triggered: Dunning Automation cycle');
            try {
                const dunningService = require('../modules/finance/invoice/services/dunning.service');
                await dunningService.runDunningCycle();
            } catch (err) {
                logger.error('Dunning Job Failed:', err);
            }
        });

        // 8. Finance: Temporary PDF Cleanup (3 AM)
        cron.schedule('0 3 * * *', async () => {
            logger.info('JOB triggered: PDF Cleanup');
            try {
                const cleanupService = require('../modules/finance/shared/services/cleanup.service');
                await cleanupService.cleanupTempPdfs();
            } catch (err) { logger.error('PDF Cleanup Job Failed:', err); }
        });

        logger.info('Background Job System active.');
    }
}

module.exports = new JobScheduler();
