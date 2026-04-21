const budgetService = require('../services/budget.service');
const catchAsync = require('../../../../utils/catchAsync');
const { AppError } = require('../../../../core/errors');

class BudgetController {
    createBudget = catchAsync(async (req, res) => {
        const budget = await budgetService.createBudget(
            req.body, 
            req.user.organizationId, 
            req.user._id
        );
        res.status(201).json({
            status: 'success',
            data: { budget }
        });
    });

    getBudgets = catchAsync(async (req, res) => {
        const budgets = await budgetService.getBudgets(req.query, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            results: budgets.length,
            data: { budgets }
        });
    });

    getBudget = catchAsync(async (req, res) => {
        const budget = await budgetService.getBudgetById(req.params.id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { budget }
        });
    });

    updateBudget = catchAsync(async (req, res) => {
        const budget = await budgetService.updateBudget(req.params.id, req.body, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { budget }
        });
    });

    deleteBudget = catchAsync(async (req, res) => {
        await budgetService.deleteBudget(req.params.id, req.user.organizationId);
        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    syncBudget = catchAsync(async (req, res) => {
        const budget = await budgetService.syncBudgetSpentAmount(req.params.id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            message: 'Budget totals recalculated from raw expenses',
            data: { budget }
        });
    });
}

module.exports = new BudgetController();
