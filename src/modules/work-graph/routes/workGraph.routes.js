const express = require('express');
const router = express.Router();
const workGraphController = require('../controllers/workGraph.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

router.get('/:projectId', workGraphController.getDependencyGraph);

module.exports = router;
