const recurringService = require('../services/recurring.service');
const catchAsync = require('../../../../utils/catchAsync');

class RecurringController {
    createTemplate = catchAsync(async (req, res) => {
        const branchId = req.user.organizationId; // assuming branch is tied to org for now, matching other finance modules
        const template = await recurringService.createTemplate(req.body, branchId, req.user._id);
        res.status(201).json({
            status: 'success',
            data: { template }
        });
    });

    getTemplates = catchAsync(async (req, res) => {
        const branchId = req.user.organizationId;
        const templates = await recurringService.getTemplates(req.query, branchId);
        res.status(200).json({
            status: 'success',
            results: templates.length,
            data: { templates }
        });
    });

    getTemplate = catchAsync(async (req, res) => {
        const branchId = req.user.organizationId;
        const template = await recurringService.getTemplateById(req.params.id, branchId);
        res.status(200).json({
            status: 'success',
            data: { template }
        });
    });

    updateTemplate = catchAsync(async (req, res) => {
        const branchId = req.user.organizationId;
        const template = await recurringService.updateTemplate(req.params.id, req.body, branchId);
        res.status(200).json({
            status: 'success',
            data: { template }
        });
    });

    deleteTemplate = catchAsync(async (req, res) => {
        const branchId = req.user.organizationId;
        await recurringService.deleteTemplate(req.params.id, branchId);
        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    toggleStatus = catchAsync(async (req, res) => {
        const branchId = req.user.organizationId;
        const template = await recurringService.toggleStatus(req.params.id, branchId);
        res.status(200).json({
            status: 'success',
            data: { template }
        });
    });
}

module.exports = new RecurringController();
