const express = require('express');
const reconciliationController = require('../controllers/reconciliation.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');
const upload = require('../../../../middlewares/upload');

const router = express.Router();

router.use(authenticate);

router.route('/')
    .get(reconciliationController.getStatements)
    .post(authorize('admin', 'accountant'), upload.single('file'), reconciliationController.uploadStatement);

router.post('/auto-match', authorize('admin', 'accountant'), reconciliationController.autoMatch);
router.post('/match', authorize('admin', 'accountant'), reconciliationController.matchPayment);

module.exports = router;
