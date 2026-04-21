const router = require('express').Router();
const ctrl = require('../controllers/recurring.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');

const financeCtrl = require('../controllers/recurringFinance.controller');

router.use(authenticate);
router.post('/rules', authorize('admin', 'manager'), ctrl.create);
router.get('/rules', ctrl.getAll);
router.patch('/rules/:id', authorize('admin', 'manager'), ctrl.update);
router.post('/rules/:id/pause', authorize('admin', 'manager'), ctrl.pause);
router.post('/rules/:id/resume', authorize('admin', 'manager'), ctrl.resume);

// Finance Templates
router.post('/finance/templates', authorize('admin', 'manager'), financeCtrl.createTemplate);
router.get('/finance/templates', financeCtrl.getTemplates);
router.patch('/finance/templates/:id/toggle', authorize('admin', 'manager'), financeCtrl.toggleStatus);

module.exports = router;
