const complianceService = require('../services/compliance.service');
const catchAsync = require('../../../../utils/catchAsync');

exports.getSettings = catchAsync(async (req, res) => {
    const settings = await complianceService.getSettings(req.user.organizationId);
    res.status(200).json({
        success: true,
        data: settings
    });
});

exports.updateLockDate = catchAsync(async (req, res) => {
    const { lockDate } = req.body;
    const settings = await complianceService.updateLockDate(req.user.organizationId, lockDate);
    res.status(200).json({
        success: true,
        data: settings,
        message: 'Lock period updated successfully'
    });
});

exports.verifyAudit = catchAsync(async (req, res) => {
    const results = await complianceService.verifyLedgerIntegrity(req.user.organizationId);
    res.status(200).json({
        success: true,
        data: results
    });
});
