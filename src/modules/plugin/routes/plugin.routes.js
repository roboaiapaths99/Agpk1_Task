const express = require('express');
const router = express.Router();
const pluginController = require('../controllers/plugin.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');

router.use(authenticate);

router.get('/', pluginController.getPlugins);
router.post('/', authorize('admin'), pluginController.registerPlugin);

module.exports = router;
