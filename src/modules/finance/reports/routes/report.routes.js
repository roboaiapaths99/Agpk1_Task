const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/profit-loss', authorize('admin', 'accountant'), reportController.getPLReport);
router.get('/revenue-breakdown', authorize('admin', 'accountant'), reportController.getRevenueBreakdown);
router.get('/balance-sheet', authorize('admin', 'accountant'), reportController.getBalanceSheet);
router.get('/cash-flow', authorize('admin', 'accountant'), reportController.getCashFlow);
router.get('/ar-aging', authorize('admin', 'accountant'), reportController.getARAging);
router.get('/ap-aging', authorize('admin', 'accountant'), reportController.getAPAging);
router.get('/dunning-list', authorize('admin', 'accountant'), reportController.getDunningList);
router.get('/forecasting', authorize('admin', 'accountant', 'manager'), reportController.getForecasting);
router.get('/dashboard', authorize('admin', 'accountant', 'manager', 'user'), reportController.getDashboard);

router.post('/export', authorize('admin', 'accountant'), reportController.exportReport);
router.post('/export/excel', authorize('admin', 'accountant'), reportController.exportExcel);
router.post('/distribute', authorize('admin', 'accountant'), reportController.distributeReport);

router.post('/dunning-action', reportController.recordDunningAction);
router.get('/dunning-history', reportController.getDunningHistory);

module.exports = router;

