const router = require('express').Router();
const wfCtrl = require('../controllers/workflow.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');

router.use(authenticate);

router.post('/', authorize('admin', 'manager'), wfCtrl.create);
router.get('/', wfCtrl.getAll);
router.get('/:id', wfCtrl.getById);
router.patch('/:id', authorize('admin', 'manager'), wfCtrl.update);
router.post('/transition', wfCtrl.transition);
router.get('/history/:taskId', wfCtrl.history);

module.exports = router;
