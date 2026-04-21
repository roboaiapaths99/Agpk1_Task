const express = require('express');
const expenseController = require('../controllers/expense.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');
const validate = require('../../../../middlewares/validate').validate;
const financeValidator = require('../../utils/finance.validator');
const checkPeriodLock = require('../../../../middleware/periodLock');

const router = express.Router();

router.use(authenticate);

router.route('/')
    .get(expenseController.getAllExpenses)
    .post(
        checkPeriodLock,
        validate(financeValidator.createExpense),
        expenseController.createExpense
    );

router.route('/:id')
    .get(expenseController.getExpense)
    .patch(
        authorize('admin', 'manager'),
        checkPeriodLock,
        // Assuming we want to use PATCH for partial updates, or PUT for full. 
        // We'll just map PATCH to updateExpense, and PATCH /:id/status to updateStatus.
        expenseController.updateExpense
    )
    .put(
        authorize('admin', 'manager'),
        checkPeriodLock,
        expenseController.updateExpense
    )
    .delete(
        authorize('admin', 'manager'),
        checkPeriodLock,
        expenseController.deleteExpense
    );

router.route('/:id/status')
    .patch(
        authorize('admin', 'manager'),
        checkPeriodLock,
        validate(financeValidator.updateExpenseStatus),
        expenseController.updateStatus
    );

router.route('/:id/restore')
    .patch(
        authorize('admin', 'manager'),
        checkPeriodLock,
        expenseController.restoreExpense
    );

router.route('/export/excel')
    .post(
        authorize('admin', 'manager'),
        expenseController.exportExpenses
    );

module.exports = router;
