const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/okr.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Objectives
router.post('/objectives', ctrl.createObjective);
router.get('/objectives', ctrl.getObjectives);
router.get('/objectives/:id', ctrl.getObjectiveById);
router.patch('/objectives/:id', ctrl.updateObjective);
router.delete('/objectives/:id', ctrl.deleteObjective);

// Key Results
router.post('/key-results', ctrl.createKeyResult);
router.patch('/key-results/:id', ctrl.updateKeyResult);
router.delete('/key-results/:id', ctrl.deleteKeyResult);
router.post('/key-results/:id/link-tasks', ctrl.linkTasks);

module.exports = router;
