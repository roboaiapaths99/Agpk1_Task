const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');

router.use(authenticate);

router.get('/tasks', exportController.exportTasks);
router.get('/invoices/excel', exportController.exportInvoicesExcel);
router.get('/tasks/excel', exportController.exportTasksExcel);
router.get('/expenses/excel', exportController.exportExpensesExcel);
router.get('/journal/excel', exportController.exportJournalExcel);
router.get('/projects/excel', exportController.exportProjectsExcel);
router.get('/tax/excel', authorize('admin', 'manager'), exportController.exportTaxExcel);

module.exports = router;
