const Expense = require('../models/Expense');
const { AppError } = require('../../../../core/errors');
const eventBus = require('../../../../core/eventBus');
const { EVENTS } = require('../../../../utils/constants');

class ExpenseService {
    async createExpense(data, organizationId, userId) {
        // Normalize: frontend sends 'merchant', model also accepts 'title'
        if (!data.title && data.merchant) {
            data.title = data.merchant;
        }
        if (!data.vendor && data.merchant) {
            data.vendor = data.merchant;
        }

        // Auto-generate expense number
        if (!data.expenseNumber) {
            data.expenseNumber = await this.generateExpenseNumber(organizationId);
        }

        // Normalize status: frontend sends 'pending', model accepts both
        if (data.status === 'pending') {
            data.status = 'pending';
        }

        const expense = await Expense.create({
            ...data,
            organizationId,
            createdBy: userId
        });

        // Publish Event for Ledger & Budget sync
        try {
            await eventBus.publish(EVENTS.EXPENSE_ADDED, {
                expenseId: expense._id,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                branchId: expense.branchId,
                organizationId
            }, organizationId, `exp_create_${expense._id}`);
        } catch (err) {
            console.error('Event publish failed:', err.message);
        }

        return expense;
    }

    async generateExpenseNumber(organizationId) {
        const year = new Date().getFullYear();
        const prefix = `EXP-${year}-`;

        const lastExpense = await Expense.findOne({
            organizationId,
            expenseNumber: new RegExp(`^${prefix}`)
        }).sort({ createdAt: -1 });

        let sequence = 1;
        if (lastExpense && lastExpense.expenseNumber) {
            const parts = lastExpense.expenseNumber.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }

        return `${prefix}${sequence.toString().padStart(4, '0')}`;
    }

    async getExpenseById(id, organizationId) {
        const expense = await Expense.findOne({ _id: id, organizationId, deletedAt: null })
            .populate('branchId', 'name code')
            .populate('projectId', 'name')
            .populate('taskId', 'title');
        if (!expense) throw new AppError('Expense not found', 404);
        return expense;
    }

    async updateExpense(id, data, organizationId) {
        const oldExpense = await Expense.findOne({ _id: id, organizationId, deletedAt: null });
        if (!oldExpense) throw new AppError('Expense not found', 404);

        const expense = await Expense.findOneAndUpdate(
            { _id: id, organizationId, deletedAt: null },
            { ...data },
            { new: true, runValidators: true }
        );

        // Publish update event for budget adjustment
        try {
            await eventBus.publish(EVENTS.EXPENSE_UPDATED, {
                expenseId: expense._id,
                oldAmount: oldExpense.amount,
                newAmount: expense.amount,
                oldCategory: oldExpense.category,
                newCategory: expense.category,
                oldDate: oldExpense.date,
                newDate: expense.date,
                organizationId
            });
        } catch (err) {
            console.error('Update event publish failed:', err.message);
        }

        return expense;
    }

    async updateExpenseStatus(id, status, approvedBy, organizationId) {
        const updateData = { status };
        if (status === 'approved') {
            updateData.approvedBy = approvedBy;
            updateData.approvalDate = new Date();
        }

        const expense = await Expense.findOneAndUpdate(
            { _id: id, organizationId, deletedAt: null },
            updateData,
            { new: true, runValidators: true }
        );

        if (!expense) throw new AppError('Expense not found', 404);
        return expense;
    }

    async softDeleteExpense(id, organizationId) {
        const expense = await Expense.findOneAndUpdate(
            { _id: id, organizationId, deletedAt: null },
            { deletedAt: new Date() },
            { new: true }
        );
        if (!expense) throw new AppError('Expense not found or already deleted', 404);

        // Publish deletion event
        try {
            await eventBus.publish(EVENTS.EXPENSE_DELETED, {
                expenseId: expense._id,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                organizationId
            });
        } catch (err) {
            console.error('Delete event publish failed:', err.message);
        }

        return expense;
    }

    async restoreExpense(id, organizationId) {
        const expense = await Expense.findOneAndUpdate(
            { _id: id, organizationId, deletedAt: { $ne: null } },
            { deletedAt: null },
            { new: true }
        );
        if (!expense) throw new AppError('Expense not found or not deleted', 404);
        return expense;
    }

    async listExpenses(filters, organizationId) {
        const query = { organizationId, deletedAt: null };
        if (filters.status) query.status = filters.status;
        if (filters.category) query.category = filters.category;
        if (filters.branch) query.branchId = filters.branch;
        
        if (filters.isDeleted === 'true') {
            query.deletedAt = { $ne: null };
        } else if (filters.isDeleted === 'all') {
            delete query.deletedAt;
        }

        return await Expense.find(query)
            .sort({ date: -1 })
            .populate('branchId', 'name code')
            .populate('projectId', 'name')
            .populate('taskId', 'title');
    }

    async getExpenseReportByCategory(organizationId) {
        const mongoose = require('mongoose');
        return await Expense.aggregate([
            { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), deletedAt: null } },
            { $group: { _id: '$category', totalAmount: { $sum: '$amount' } } }
        ]);
    }
}

module.exports = new ExpenseService();
