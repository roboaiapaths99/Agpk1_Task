const express = require('express');
const ledgerController = require('../controllers/ledger.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');

const router = express.Router();

router.use(authenticate);

router.get('/trial-balance', ledgerController.getTrialBalance);
router.post('/manual-entry', authorize('admin', 'accountant'), ledgerController.postManualEntry);

module.exports = router;
