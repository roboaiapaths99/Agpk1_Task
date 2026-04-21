const RecurringTemplate = require('../models/recurringTemplate.model');
const { AppError } = require('../../../../core/errors');

class RecurringService {
    async createTemplate(data, branchId, userId) {
        const template = await RecurringTemplate.create({
            ...data,
            branchId,
            createdBy: userId
        });
        return template;
    }

    async getTemplates(query = {}, branchId) {
        const filters = { branchId };
        if (query.type) filters.type = query.type;
        if (query.status) filters.status = query.status;

        return await RecurringTemplate.find(filters).sort('-createdAt');
    }

    async getTemplateById(id, branchId) {
        const template = await RecurringTemplate.findOne({ _id: id, branchId });
        if (!template) throw new AppError('Recurring template not found', 404);
        return template;
    }

    async updateTemplate(id, data, branchId) {
        const template = await RecurringTemplate.findOneAndUpdate(
            { _id: id, branchId },
            data,
            { new: true, runValidators: true }
        );
        if (!template) throw new AppError('Recurring template not found', 404);
        return template;
    }

    async deleteTemplate(id, branchId) {
        const template = await RecurringTemplate.findOneAndDelete({ _id: id, branchId });
        if (!template) throw new AppError('Recurring template not found', 404);
        return template;
    }

    async toggleStatus(id, branchId) {
        const template = await this.getTemplateById(id, branchId);
        template.status = template.status === 'active' ? 'paused' : 'active';
        await template.save();
        return template;
    }

    async processPendingTemplates() {
        const invoiceService = require('../../invoice/services/invoice.service');
        const expenseService = require('../../expenses/services/expense.service');
        const logger = require('../../../../core/logger');

        // Find all active templates overdue for a run
        const pendingTemplates = await RecurringTemplate.find({
            status: 'active',
            nextRunDate: { $lte: new Date() }
        });

        for (const template of pendingTemplates) {
            try {
                if (template.type === 'invoice') {
                    await invoiceService.createInvoice(template.data, template.branchId, template.createdBy);
                } else if (template.type === 'expense') {
                    await expenseService.createExpense(template.data, template.branchId, template.createdBy);
                }

                template.lastRunDate = new Date();
                
                // Calculate next run date
                const nextRun = new Date(template.lastRunDate);
                if (template.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1);
                else if (template.frequency === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
                else if (template.frequency === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);
                else if (template.frequency === 'yearly') nextRun.setFullYear(nextRun.getFullYear() + 1);

                template.nextRunDate = nextRun;
                await template.save();

                logger.info(`Processed recurring template ${template._id} successfully.`);
            } catch (err) {
                logger.error(`Error processing recurring template ${template._id}:`, err);
            }
        }
    }
}

module.exports = new RecurringService();
