const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');

router.use(authenticate);

router.get('/team-score', authorize('admin', 'manager'), healthController.getTeamScore);

module.exports = router;
