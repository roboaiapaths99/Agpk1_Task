const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');
const validate = require('../../../../middlewares/validate').validate;
const financeValidator = require('../../utils/finance.validator');
const checkPeriodLock = require('../../../../middleware/periodLock');

const router = express.Router();

router.use(authenticate);

router.route('/')
    .get(paymentController.getAllPayments)
    .post(
        authorize('admin', 'accountant'),
        checkPeriodLock,
        validate(financeValidator.recordPayment),
        paymentController.recordPayment
    );

router.route('/:id')
    .get(paymentController.getPayment);

module.exports = router;
