const ledgerService = require('../services/ledger.service');
const catchAsync = require('../../../../utils/catchAsync');

class LedgerController {
    getTrialBalance = catchAsync(async (req, res) => {
        const accounts = await ledgerService.getTrialBalance(req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { accounts }
        });
    });

    postManualEntry = catchAsync(async (req, res) => {
        const entry = await ledgerService.postTransaction(req.body, req.user.organizationId, req.user._id);
        res.status(201).json({
            status: 'success',
            data: { entry }
        });
    });
}

module.exports = new LedgerController();
