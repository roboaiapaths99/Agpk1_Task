const express = require('express');
const budgetController = require('../controllers/budget.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router
    .route('/')
    .get(authorize('admin', 'accountant', 'manager'), budgetController.getBudgets)
    .post(authorize('admin', 'accountant'), budgetController.createBudget);

router
    .route('/:id')
    .get(authorize('admin', 'accountant', 'manager'), budgetController.getBudget)
    .patch(authorize('admin', 'accountant'), budgetController.updateBudget)
    .delete(authorize('admin', 'accountant'), budgetController.deleteBudget);

router.post('/:id/sync', authorize('admin', 'accountant'), budgetController.syncBudget);

module.exports = router;
