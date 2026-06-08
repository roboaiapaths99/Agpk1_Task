const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/doc.controller');
const { authenticate } = require('../../../middlewares/auth');
const { validate } = require('../../../middlewares/validate');
const { createDocSchema, updateDocSchema, linkTaskSchema } = require('../validators/doc.validator');

// All routes require authentication
router.use(authenticate);

// Templates
router.get('/templates', ctrl.getTemplates);

// Doc tree for sidebar navigation
router.get('/tree', ctrl.getDocTree);

// Versions
router.get('/:id/versions', ctrl.getVersions);

// CRUD
router.post('/', validate(createDocSchema), ctrl.create);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.patch('/:id', validate(updateDocSchema), ctrl.update);
router.delete('/:id', ctrl.archive);

// Task linking
router.post('/:id/link-task', validate(linkTaskSchema), ctrl.linkTask);
router.delete('/:id/link-task', validate(linkTaskSchema), ctrl.unlinkTask);

// Template conversion
router.post('/:id/convert-template', ctrl.convertToTemplate);

module.exports = router;

