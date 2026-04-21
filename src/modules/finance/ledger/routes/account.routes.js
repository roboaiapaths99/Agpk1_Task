const express = require('express');
const accountController = require('../controllers/account.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');
const validate = require('../../../../middleware/validate');
const financeValidator = require('../../utils/finance.validator');

const router = express.Router();

router.use(authenticate);

router.post('/seed-defaults', authorize('admin'), accountController.seedDefaults);

router.route('/')
    .get(accountController.getAccounts)
    .post(authorize('admin', 'accountant'), validate(financeValidator.createAccount), accountController.createAccount);

router.get('/tree', accountController.getAccountTree);

router.route('/:id')
    .get(accountController.getAccount)
    .patch(authorize('admin', 'accountant'), validate(financeValidator.updateAccount), accountController.updateAccount)
    .delete(authorize('admin', 'accountant'), accountController.deleteAccount);

module.exports = router;
