const express = require('express');
const recurringController = require('../controllers/recurring.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(authenticate);
router.use(authorize('admin', 'finance_manager'));

router.route('/')
    .get(recurringController.getTemplates)
    .post(recurringController.createTemplate);

router.route('/:id')
    .get(recurringController.getTemplate)
    .put(recurringController.updateTemplate)
    .delete(recurringController.deleteTemplate);

router.patch('/:id/toggle', recurringController.toggleStatus);

module.exports = router;
