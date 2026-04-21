const branchService = require('../services/branch.service');
const catchAsync = require('../../../../utils/catchAsync');
const { success } = require('../../../../utils/response');

class BranchController {
    createBranch = catchAsync(async (req, res) => {
        const branch = await branchService.createBranch(req.body, req.user.organizationId);
        return success(res, { branch }, 'Branch created successfully', 201);
    });

    getBranch = catchAsync(async (req, res) => {
        const branch = await branchService.getBranchById(req.params.id, req.user.organizationId);
        return success(res, { branch });
    });

    getAllBranches = catchAsync(async (req, res) => {
        const branches = await branchService.listBranches(req.query, req.user.organizationId);
        return success(res, { branches });
    });

    updateBranch = catchAsync(async (req, res) => {
        const branch = await branchService.updateBranch(req.params.id, req.body, req.user.organizationId);
        return success(res, { branch }, 'Branch updated successfully');
    });

    deleteBranch = catchAsync(async (req, res) => {
        await branchService.deleteBranch(req.params.id, req.user.organizationId);
        return success(res, null, 'Branch inactivated successfully');
    });
}

module.exports = new BranchController();
