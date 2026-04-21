const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/compliance.controller');
const { authenticate } = require('../../../../middlewares/auth');

// All compliance routes require authentication
router.use(authenticate);

router.get('/settings', complianceController.getSettings);
router.post('/lock-period', complianceController.updateLockDate);
router.get('/verify-audit', complianceController.verifyAudit);

module.exports = router;
