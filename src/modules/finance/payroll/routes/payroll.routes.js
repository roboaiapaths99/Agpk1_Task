const express = require('express');
const payrollController = require('../controllers/payroll.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');

const router = express.Router();

// All routes are protected by organization-level auth
router.use(authenticate);

// Payroll Runs
router.route('/runs')
    .get(payrollController.getPayrollRuns)
    .post(payrollController.generatePayroll);

router.post('/runs/:id/finalize', payrollController.finalizePayroll);
router.get('/runs/:id/summary', payrollController.downloadSummary);

// Payslips
router.get('/runs/:runId/payslips', payrollController.getPayslips);
router.get('/payslips/:id/download', payrollController.downloadPayslip);

// Employee Profiles (HR/Finance Admins)
router.route('/profiles')
    .get(payrollController.getEmployeeProfiles)
    .post(payrollController.upsertEmployeeProfile);

module.exports = router;
