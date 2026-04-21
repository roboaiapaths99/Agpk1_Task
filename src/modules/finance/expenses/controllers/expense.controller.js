const expenseService = require('../services/expense.service');
const catchAsync = require('../../../../utils/catchAsync');
const excelService = require('../../../shared/services/excel.service');

class ExpenseController {
    createExpense = catchAsync(async (req, res) => {
        const expense = await expenseService.createExpense(req.body, req.user.organizationId, req.user._id);
        res.status(201).json({
            status: 'success',
            data: { expense }
        });
    });

    getExpense = catchAsync(async (req, res) => {
        const expense = await expenseService.getExpenseById(req.params.id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { expense }
        });
    });

    getAllExpenses = catchAsync(async (req, res) => {
        const expenses = await expenseService.listExpenses(req.query, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            results: expenses.length,
            data: { expenses }
        });
    });

    updateStatus = catchAsync(async (req, res) => {
        const { status } = req.body;
        const expense = await expenseService.updateExpenseStatus(req.params.id, status, req.user._id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { expense }
        });
    });
    updateExpense = catchAsync(async (req, res) => {
        const expense = await expenseService.updateExpense(req.params.id, req.body, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { expense }
        });
    });

    deleteExpense = catchAsync(async (req, res) => {
        await expenseService.softDeleteExpense(req.params.id, req.user.organizationId);
        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    restoreExpense = catchAsync(async (req, res) => {
        const expense = await expenseService.restoreExpense(req.params.id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { expense }
        });
    });

    exportExpenses = catchAsync(async (req, res) => {
        const expenses = await expenseService.listExpenses(req.body, req.user.organizationId);
        const excelUrl = await excelService.generateExpensesExcel(expenses);
        
        res.status(200).json({
            status: 'success',
            data: { excelUrl }
        });
    });
}

module.exports = new ExpenseController();
