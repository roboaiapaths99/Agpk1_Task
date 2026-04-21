const express = require('express');
const router = express.Router();
const slaController = require('../controllers/sla.controller');
const auth = require('../../../middlewares/auth');
const rbac = require('../../../middlewares/rbac');

router.use(auth.authenticate);

router.get('/', rbac.requirePermission('read:sla'), slaController.getPolicies);
router.post('/', rbac.requirePermission('create:sla'), slaController.createPolicy);
router.put('/:id', rbac.requirePermission('update:sla'), slaController.updatePolicy);
router.delete('/:id', rbac.requirePermission('delete:sla'), slaController.deletePolicy);

module.exports = router;
