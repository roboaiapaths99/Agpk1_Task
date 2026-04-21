const Invoice = require('../models/Invoice');
const Organization = require('../../../auth/models/Organization');
const NotificationService = require('../../../notification/services/notification.service');
const SlackService = require('../../../integration/services/slack.service');
const logger = require('../../../../core/logger');
const dayjs = require('dayjs');

class DunningService {
    /**
     * Run the full dunning cycle for all active organizations
     */
    async runDunningCycle() {
        logger.info('[DUNNING] Starting dunning cycle...');
        
        const orgs = await Organization.find({ 
            'dunningSettings.enabled': true,
            status: 'active'
        });

        logger.info(`[DUNNING] Found ${orgs.length} organizations with dunning enabled.`);

        const results = {
            processed: 0,
            notificationsSent: 0,
            failedInvoices: 0
        };

        for (const org of orgs) {
            try {
                const orgResults = await this.processOrganizationDunning(org);
                results.processed += orgResults.processed;
                results.notificationsSent += orgResults.notificationsSent;
                results.failedInvoices += orgResults.failedInvoices;
            } catch (err) {
                logger.error(`[DUNNING] Error processing org ${org.name}: ${err.message}`);
            }
        }

        logger.info('[DUNNING] Dunning cycle completed.', results);
        return results;
    }

    /**
     * Process dunning for a single organization
     */
    async processOrganizationDunning(org) {
        const stages = org.dunningSettings.stages || [];
        if (stages.length === 0) return { processed: 0, notificationsSent: 0, failedInvoices: 0 };

        // Sort stages by days after due
        const sortedStages = [...stages].sort((a, b) => a.daysAfterDue - b.daysAfterDue);

        // Fetch unpaid invoices
        const invoices = await Invoice.find({
            organizationId: org._id,
            status: { $in: ['sent', 'partial', 'overdue'] },
            deletedAt: null
        });

        const results = { processed: invoices.length, notificationsSent: 0, failedInvoices: 0 };

        for (const invoice of invoices) {
            try {
                const daysOverdue = dayjs().diff(dayjs(invoice.dueDate), 'day');
                if (daysOverdue < 0) continue; // Not overdue yet

                // Update status to overdue if not already
                if (invoice.status !== 'overdue') {
                    invoice.status = 'overdue';
                    await invoice.save();
                }

                // Determine the highest stage applicable to this invoice
                let applicableStage = null;
                let stageNumber = 0;

                for (let i = 0; i < sortedStages.length; i++) {
                    if (daysOverdue >= sortedStages[i].daysAfterDue) {
                        applicableStage = sortedStages[i];
                        stageNumber = i + 1;
                    }
                }

                if (!applicableStage) continue;

                // Check if this stage notification was already sent
                const alreadySent = invoice.dunningHistory.some(h => h.stage === stageNumber && h.status === 'success');
                if (alreadySent) continue;

                // Send notifications
                const sentResults = await this.sendDunningNotifications(org, invoice, applicableStage, stageNumber);
                
                // Track history
                for (const channel of sentResults) {
                    invoice.dunningHistory.push({
                        stage: stageNumber,
                        method: channel.method,
                        status: channel.success ? 'success' : 'failed'
                    });
                }
                
                await invoice.save();
                results.notificationsSent += sentResults.filter(r => r.success).length;

            } catch (err) {
                logger.error(`[DUNNING] Failed to process invoice ${invoice.invoiceNumber}: ${err.message}`);
                results.failedInvoices++;
            }
        }

        return results;
    }

    /**
     * Send notifications across configured channels
     */
    async sendDunningNotifications(org, invoice, stage, stageNumber) {
        const channels = stage.channels || ['email'];
        const results = [];

        const title = `Overdue Invoice: ${invoice.invoiceNumber}`;
        const message = stage.template || `Invoice ${invoice.invoiceNumber} for amount ${invoice.totalAmount} ${invoice.currency} is ${dayjs().diff(dayjs(invoice.dueDate), 'day')} days overdue. Please process payment at your earliest convenience.`;

        for (const channel of channels) {
            let success = false;
            try {
                if (channel === 'email') {
                    // Trigger email through NotificationService (mocked email)
                    await NotificationService.createNotification(invoice.customerId, org._id, {
                        title,
                        message,
                        type: stage.action === 'warn' ? 'warning' : 'info',
                        category: 'automation',
                        link: `/finance/invoices/${invoice._id}`
                    });
                    success = true;
                } else if (channel === 'in_app') {
                    await NotificationService.createNotification(invoice.customerId, org._id, {
                        title,
                        message,
                        type: stage.action === 'warn' ? 'warning' : 'info',
                        category: 'automation',
                        link: `/finance/invoices/${invoice._id}`
                    });
                    success = true;
                } else if (channel === 'slack') {
                    const slackResult = await SlackService.sendNotification(org._id, {
                        type: 'dunning_reminder',
                        data: {
                            invoiceNumber: invoice.invoiceNumber,
                            amount: invoice.totalAmount,
                            currency: invoice.currency,
                            daysOverdue: dayjs().diff(dayjs(invoice.dueDate), 'day'),
                            customerName: invoice.customerId // Ideally we'd populate this
                        }
                    });
                    success = slackResult.sent;
                }
            } catch (err) {
                logger.error(`[DUNNING] Notification failed on channel ${channel}: ${err.message}`);
            }
            results.push({ method: channel, success });
        }

        return results;
    }
}

module.exports = new DunningService();
