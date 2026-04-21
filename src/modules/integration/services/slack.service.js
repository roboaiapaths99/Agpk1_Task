const crypto = require('crypto');
const IntegrationConfig = require('../models/IntegrationConfig');

class SlackService {
    /**
     * Connect Slack integration
     */
    async connect({ organizationId, webhookUrl, signingSecret, eventSubscriptions, userId }) {
        const config = await IntegrationConfig.findOneAndUpdate(
            { organizationId, provider: 'slack' },
            {
                provider: 'slack',
                organizationId,
                isActive: true,
                config: {
                    webhookUrl,
                    signingSecret: signingSecret || '',
                    eventSubscriptions: eventSubscriptions || ['task_created', 'task_completed', 'sprint_completed'],
                },
                connectedBy: userId,
                lastSyncAt: new Date(),
            },
            { upsert: true, new: true }
        );

        return { success: true, message: 'Slack connected successfully.' };
    }

    async disconnect(organizationId) {
        await IntegrationConfig.findOneAndUpdate(
            { organizationId, provider: 'slack' },
            { isActive: false, 'config.webhookUrl': '' }
        );
        return { success: true };
    }

    async getStatus(organizationId) {
        const config = await IntegrationConfig.findOne({ organizationId, provider: 'slack' })
            .populate('connectedBy', 'name email')
            .lean();

        if (!config || !config.isActive) return { connected: false };
        return {
            connected: true,
            connectedBy: config.connectedBy,
            eventSubscriptions: config.config?.eventSubscriptions || [],
            lastSyncAt: config.lastSyncAt,
        };
    }

    /**
     * Send notification message to Slack via incoming webhook
     */
    async sendNotification(organizationId, event) {
        const config = await IntegrationConfig.findOne({
            organizationId,
            provider: 'slack',
            isActive: true,
        });

        if (!config || !config.config?.webhookUrl) return { sent: false, reason: 'Not configured' };

        // Check if this event type is subscribed
        const subs = config.config.eventSubscriptions || [];
        if (!subs.includes(event.type)) return { sent: false, reason: 'Event not subscribed' };

        const message = this.formatMessage(event);

        try {
            const response = await fetch(config.config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message),
            });

            if (response.ok) {
                await IntegrationConfig.findByIdAndUpdate(config._id, { lastSyncAt: new Date() });
                return { sent: true };
            }
            return { sent: false, reason: `Slack API returned ${response.status}` };
        } catch (err) {
            return { sent: false, reason: err.message };
        }
    }

    /**
     * Format event into Slack Block Kit message
     */
    formatMessage(event) {
        const blocks = [];

        switch (event.type) {
            case 'task_created':
                blocks.push(
                    { type: 'section', text: { type: 'mrkdwn', text: `🆕 *New Task Created*\n*${event.data.title}*` } },
                    {
                        type: 'context', elements: [
                            { type: 'mrkdwn', text: `Priority: \`${event.data.priority || 'medium'}\` | Assigned to: ${event.data.assignee || 'Unassigned'}` }
                        ]
                    }
                );
                break;

            case 'task_completed':
                blocks.push(
                    { type: 'section', text: { type: 'mrkdwn', text: `✅ *Task Completed*\n*${event.data.title}*` } },
                    {
                        type: 'context', elements: [
                            { type: 'mrkdwn', text: `Completed by: ${event.data.completedBy || 'Unknown'}` }
                        ]
                    }
                );
                break;

            case 'task_blocked':
                blocks.push(
                    { type: 'section', text: { type: 'mrkdwn', text: `🚫 *Task Blocked*\n*${event.data.title}*` } },
                    {
                        type: 'context', elements: [
                            { type: 'mrkdwn', text: `Reason: ${event.data.reason || 'No reason provided'}` }
                        ]
                    }
                );
                break;

            case 'sprint_completed':
                blocks.push(
                    { type: 'section', text: { type: 'mrkdwn', text: `🏁 *Sprint Completed*\n*${event.data.sprintName}*` } },
                    {
                        type: 'context', elements: [
                            { type: 'mrkdwn', text: `Tasks done: ${event.data.completedCount}/${event.data.totalCount} | Velocity: ${event.data.velocity} pts` }
                        ]
                    }
                );
                break;

            case 'dunning_reminder':
                blocks.push(
                    { type: 'section', text: { type: 'mrkdwn', text: `⚠️ *Payment Reminder*\nInvoice *${event.data.invoiceNumber}* is *${event.data.daysOverdue} days overdue*.` } },
                    {
                        type: 'section', fields: [
                            { type: 'mrkdwn', text: `*Amount:*\n${event.data.amount} ${event.data.currency}` },
                            { type: 'mrkdwn', text: `*Customer:*\n${event.data.customerName || 'Unknown'}` }
                        ]
                    },
                    {
                        type: 'actions',
                        elements: [
                            {
                                type: 'button',
                                text: { type: 'plain_text', text: 'View Invoice' },
                                url: `${process.env.FRONTEND_URL}/finance/invoices/${event.data.invoiceNumber}`
                            }
                        ]
                    }
                );
                break;

            default:
                blocks.push(
                    { type: 'section', text: { type: 'mrkdwn', text: `📌 *${event.type}*\n${JSON.stringify(event.data).substring(0, 200)}` } }
                );
        }

        return { blocks };
    }

    /**
     * Send test message to verify connection
     */
    async sendTestMessage(organizationId) {
        return this.sendNotification(organizationId, {
            type: 'task_created',
            data: { title: '🧪 Test notification from AGPK1-Task', priority: 'info', assignee: 'System' },
        });
    }

    /**
     * Verify Slack request signature
     */
    verifySlackSignature(body, timestamp, signature, signingSecret) {
        if (!signingSecret) return false;
        const baseString = `v0:${timestamp}:${body}`;
        const mySignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(baseString).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature));
    }
}

module.exports = new SlackService();
