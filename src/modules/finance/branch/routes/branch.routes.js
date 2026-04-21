const express = require('express');
const branchController = require('../controllers/branch.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');
const validate = require('../../../../middlewares/validate').validate;
const financeValidator = require('../../utils/finance.validator');

const router = express.Router();

router.use(authenticate);

router.route('/')
    .get(branchController.getAllBranches)
    .post(
        authorize('admin', 'manager'),
        validate(financeValidator.createBranch),
        branchController.createBranch
    );

router.route('/:id')
    .get(branchController.getBranch)
    .patch(
        authorize('admin', 'manager'),
        validate(financeValidator.updateBranch),
        branchController.updateBranch
    )
    .delete(
        authorize('admin', 'manager'),
        branchController.deleteBranch
    );

module.exports = router;
