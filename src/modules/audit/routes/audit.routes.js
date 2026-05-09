const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');

router.use(authenticate);
router.use(authorize('admin', 'manager', 'user'));

router.get('/logs', auditController.getLogs);
router.get('/filters', auditController.getFilters);
router.get('/history/:id', auditController.getEntityHistory);
router.get('/history/:id/export', auditController.exportEntityHistory);

module.exports = router;
