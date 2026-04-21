const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/doc.controller');
const { authenticate } = require('../../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Templates
router.get('/templates', ctrl.getTemplates);

// Doc tree for sidebar navigation
router.get('/tree', ctrl.getDocTree);

// CRUD
router.post('/', ctrl.create);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.archive);

// Task linking
router.post('/:id/link-task', ctrl.linkTask);
router.delete('/:id/link-task', ctrl.unlinkTask);

// Template conversion
router.post('/:id/convert-template', ctrl.convertToTemplate);

module.exports = router;
