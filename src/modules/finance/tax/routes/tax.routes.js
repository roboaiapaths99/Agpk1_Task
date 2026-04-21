const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');

router.use(authenticate);

router.post('/configs', authorize('admin', 'manager'), taxController.createTaxConfig);
router.get('/configs', authorize('admin', 'manager'), taxController.getTaxConfigs);
router.get('/configs/history', authorize('admin', 'manager'), taxController.getTaxHistory);
router.patch('/configs/:id', authorize('admin', 'manager'), taxController.updateTaxConfig);
router.delete('/configs/:id', authorize('admin', 'manager'), taxController.deleteTaxConfig);
router.post('/calculate', authorize('admin', 'manager'), taxController.calculateTax);

module.exports = router;
