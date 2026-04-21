const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);
router.get('/', ctrl.getMy);
router.get('/unread-count', ctrl.getUnreadCount);
router.get('/unread/count', ctrl.getUnreadCount);

router.patch('/:id/read', ctrl.markRead);
router.post('/read-all', ctrl.markAllRead);

module.exports = router;
