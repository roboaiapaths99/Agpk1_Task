const express = require('express');
const router = express.Router();
const standupController = require('../controllers/standup.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

router.post('/submit', standupController.submitStandup);
router.get('/team', standupController.getTeamStandups);
router.get('/me', standupController.getMyStandups);

module.exports = router;
