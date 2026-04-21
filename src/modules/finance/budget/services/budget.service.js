const Budget = require('../models/Budget');
const Expense = require('../../expenses/models/Expense');
const { AppError } = require('../../../../core/errors');
const mongoose = require('mongoose');

class BudgetService {
    async createBudget(data, organizationId, userId) {
        // Initial sync of spent amount from existing expenses in same category/period
        const spentAmount = await this.calculateSpentFromExpenses({
            organizationId,
            category: data.category,
            startDate: data.startDate,
            endDate: data.endDate
        });

        const budget = await Budget.create({
            ...data,
            spentAmount,
            organizationId,
            createdBy: userId
        });
        return budget;
    }

    async getBudgets(filters, organizationId) {
        const query = { organizationId };
        if (filters.status) query.status = filters.status;
        if (filters.category) query.category = filters.category;
        
        return await Budget.find(query).sort({ startDate: -1 });
    }

    async getBudgetById(id, organizationId) {
        const budget = await Budget.findOne({ _id: id, organizationId });
        if (!budget) throw new AppError('Budget not found', 404);
        return budget;
    }

    async updateBudget(id, data, organizationId) {
        const budget = await Budget.findOneAndUpdate(
            { _id: id, organizationId },
            { ...data },
            { new: true, runValidators: true }
        );
        if (!budget) throw new AppError('Budget not found', 404);
        return budget;
    }

    async deleteBudget(id, organizationId) {
        const budget = await Budget.findOneAndDelete({ _id: id, organizationId });
        if (!budget) throw new AppError('Budget not found', 404);
        return budget;
    }

    /**
     * Atomically increment/decrement spentAmount for matching budgets.
     * Used by event subscribers.
     */
    async adjustSpentAmount(params) {
        const { organizationId, category, date, amount } = params;
        
        // Find all active budgets that this expense falls into
        const query = {
            organizationId,
            status: 'active',
            startDate: { $lte: new Date(date) },
            endDate: { $gte: new Date(date) },
            $or: [
                { category: category },
                { category: null },
                { category: { $exists: false } }
            ]
        };

        const result = await Budget.updateMany(query, {
            $inc: { spentAmount: amount }
        });

        return result;
    }

    /**
     * Recalculates the spentAmount for a specific budget from scratch.
     */
    async syncBudgetSpentAmount(budgetId, organizationId) {
        const budget = await Budget.findOne({ _id: budgetId, organizationId });
        if (!budget) throw new AppError('Budget not found', 404);

        const spentAmount = await this.calculateSpentFromExpenses({
            organizationId: budget.organizationId,
            category: budget.category,
            startDate: budget.startDate,
            endDate: budget.endDate
        });

        budget.spentAmount = spentAmount;
        await budget.save();
        return budget;
    }

    /**
     * Helper to aggregate expense totals for a category and date range.
     */
    async calculateSpentFromExpenses(params) {
        const { organizationId, category, startDate, endDate } = params;
        
        const match = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            deletedAt: null,
            status: 'paid', // Only count paid or approved expenses? Let's say paid for strict budget
            date: { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            }
        };

        if (category) {
            match.category = category;
        }

        const stats = await Expense.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return stats.length > 0 ? stats[0].total : 0;
    }
}

module.exports = new BudgetService();
