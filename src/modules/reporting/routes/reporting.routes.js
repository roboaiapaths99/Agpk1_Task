const router = require('express').Router();
const ctrl = require('../controllers/reporting.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');

router.use(authenticate, authorize('admin', 'manager', 'user'));
router.get('/workload', ctrl.workload);
router.get('/sla', ctrl.sla);
router.get('/burn/:projectId', ctrl.burn);
router.get('/bottleneck', ctrl.bottleneck);
router.get('/dashboard-summary', ctrl.dashboardSummary);

module.exports = router;
