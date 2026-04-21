const RecurringTemplate = require('../models/RecurringTemplate');
const Invoice = require('../../finance/invoice/models/Invoice');
const Expense = require('../../finance/expenses/models/Expense');
const logger = require('../../../core/logger');

class RecurringFinanceService {
    async processPendingTemplates() {
        const today = new Date();
        
        const templates = await RecurringTemplate.find({
            status: 'active',
            nextRunDate: { $lte: today }
        });

        logger.info(`Found ${templates.length} recurring finance templates to process.`);

        for (const template of templates) {
            try {
                if (template.type === 'invoice') {
                    await this.createInvoice(template);
                } else if (template.type === 'expense') {
                    await this.createExpense(template);
                }

                await this.updateNextRunDate(template);
            } catch (err) {
                logger.error(`Failed to process template ${template._id}:`, err);
            }
        }
    }

    async createInvoice(template) {
        const amount = template.invoiceItems.reduce((acc, item) => acc + (item.quantity * item.price) + (item.tax || 0), 0);
        
        const invoice = new Invoice({
            invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            customer: template.customerId,
            items: template.invoiceItems,
            totalAmount: amount,
            amountDue: amount,
            status: 'draft',
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Due in 15 days
            organizationId: template.organizationId,
            createdBy: template.createdBy,
            notes: `Auto-generated from Recurring Template: ${template.name}`
        });

        await invoice.save();
        logger.debug(`Created recurring invoice ${invoice.invoiceNumber}`);
    }

    async createExpense(template) {
        const expense = new Expense({
             expenseNumber: `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
             title: template.name,
             merchant: template.merchant || 'Generic Vendor',
             category: template.category || 'Recurring',
             amount: template.amount,
             currency: template.currency || 'INR',
             date: new Date(),
             status: 'pending',
             organizationId: template.organizationId,
             createdBy: template.createdBy,
             notes: `Auto-generated from Recurring Template: ${template.name}`
        });

        await expense.save();
        logger.debug(`Created recurring expense ${expense.expenseNumber}`);
    }

    async updateNextRunDate(template) {
        let newDate = new Date(template.nextRunDate);
        
        while (newDate <= new Date()) {
             if (template.frequency === 'daily') newDate.setDate(newDate.getDate() + 1);
             else if (template.frequency === 'weekly') newDate.setDate(newDate.getDate() + 7);
             else if (template.frequency === 'monthly') newDate.setMonth(newDate.getMonth() + 1);
             else if (template.frequency === 'yearly') newDate.setFullYear(newDate.getFullYear() + 1);
        }

        template.lastRunDate = new Date();
        template.nextRunDate = newDate;
        await template.save();
    }
}

module.exports = new RecurringFinanceService();
