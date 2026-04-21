const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/resource.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

router.get('/capacity', ctrl.getTeamCapacity);
router.patch('/capacity/:userId', ctrl.setCapacity);
router.post('/time-off/:userId', ctrl.addTimeOff);
router.get('/suggest/:taskId', ctrl.suggestReassignment);

module.exports = router;
