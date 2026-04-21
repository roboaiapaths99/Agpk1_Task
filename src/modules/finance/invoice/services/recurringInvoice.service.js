const RecurringInvoice = require('../models/RecurringInvoice');
const InvoiceService = require('./invoice.service');

class RecurringInvoiceService {
    /**
     * Process all recurring invoices due today
     */
    async processPendingRecurringItems() {
        const today = new Date();
        const pending = await RecurringInvoice.find({
            status: 'active',
            nextRunDate: { $lte: today }
        });

        for (const item of pending) {
            try {
                // 1. Generate Invoice
                await InvoiceService.createInvoice({
                    customerId: item.customerId,
                    items: item.templateItems,
                    dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    notes: `Auto-generated from recurring profile: ${item.name}`,
                    sourceType: 'recurring',
                    sourceId: item._id
                }, item.organizationId);

                // 2. Calculate next run date
                let nextDate = new Date(item.nextRunDate);
                if (item.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                if (item.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                if (item.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
                if (item.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

                item.nextRunDate = nextDate;
                await item.save();
            } catch (err) {
                console.error(`Failed to process recurring invoice ${item._id}:`, err);
            }
        }
    }

    async createProfile(data, organizationId) {
        return await RecurringInvoice.create({ ...data, organizationId });
    }
}

module.exports = new RecurringInvoiceService();
