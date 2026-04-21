const express = require('express');
const invoiceController = require('../controllers/invoice.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');
const validate = require('../../../../middlewares/validate').validate;
const financeValidator = require('../../utils/finance.validator');
const checkPeriodLock = require('../../../../middleware/periodLock');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.route('/')
    .get(invoiceController.getAllInvoices)
    .post(
        authorize('admin', 'accountant'),
        checkPeriodLock,
        validate(financeValidator.createInvoice),
        invoiceController.createInvoice
    );

router.route('/:id')
    .get(invoiceController.getInvoice)
    .patch(
        authorize('admin', 'accountant'),
        checkPeriodLock,
        invoiceController.updateInvoice 
    )
    .put(
        authorize('admin', 'accountant'),
        checkPeriodLock,
        // validate(financeValidator.updateInvoice), // Assuming we have or will have this
        invoiceController.updateInvoice
    )
    .delete(
        authorize('admin', 'accountant'),
        checkPeriodLock,
        invoiceController.deleteInvoice
    );

router.route('/:id/status')
    .patch(
        authorize('admin', 'accountant'),
        checkPeriodLock,
        validate(financeValidator.updateInvoiceStatus),
        invoiceController.updateStatus
    );

router.route('/:id/restore')
    .patch(
        authorize('admin', 'accountant'),
        checkPeriodLock,
        invoiceController.restoreInvoice
    );

router.route('/:id/download')
    .get(invoiceController.downloadInvoice);

router.route('/export/excel')
    .post(
        authorize('admin', 'accountant'),
        invoiceController.exportInvoices
    );

router.post('/dunning/trigger',
    authorize('admin', 'accountant'),
    invoiceController.triggerDunningCycle
);

module.exports = router;
