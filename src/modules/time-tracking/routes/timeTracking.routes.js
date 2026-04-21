const router = require('express').Router();
const ctrl = require('../controllers/timeTracking.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);
router.post('/start', ctrl.start);
router.post('/stop', ctrl.stop);
router.get('/active', ctrl.getActive);
router.get('/me', ctrl.myLogs);
router.get('/task/:taskId', ctrl.taskLogs);
router.post('/manual', ctrl.manual);

module.exports = router;
