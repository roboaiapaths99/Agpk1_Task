const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

router.get('/suggest-assignee/:taskId', aiController.suggestAssignee);
router.get('/predict-risk/:taskId', aiController.predictDelayRisk);
router.get('/forecast/:projectId', aiController.getSprintForecast);
router.get('/breakdown-epic/:taskId', aiController.breakdownEpic);
router.get('/team-health', aiController.predictTeamHealth);

router.post('/generate-workflow', aiController.generateWorkflow);
router.post('/generate-content', aiController.generateContent);

module.exports = router;
