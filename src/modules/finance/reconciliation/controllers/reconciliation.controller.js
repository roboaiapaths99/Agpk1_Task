const reconciliationService = require('../services/reconciliation.service');
const catchAsync = require('../../../../utils/catchAsync');
const AppError = require('../../../../utils/appError');

class ReconciliationController {
    uploadStatement = catchAsync(async (req, res) => {
        if (!req.file) {
            throw new AppError('Please upload a CSV file', 400);
        }

        const entries = await reconciliationService.processCSV(req.file.path);
        
        const statementData = {
            bankName: req.body.bankName,
            accountNumber: req.body.accountNumber,
            statementDate: req.body.statementDate || new Date(),
            entries
        };

        const statement = await reconciliationService.uploadStatement(statementData, req.user.organizationId, req.user._id);
        res.status(201).json({ status: 'success', data: { statement } });
    });

    getStatements = catchAsync(async (req, res) => {
        const statements = await reconciliationService.getStatements(req.user.organizationId);
        res.status(200).json({ status: 'success', data: { statements } });
    });

    autoMatch = catchAsync(async (req, res) => {
        const { statementId } = req.body;
        const result = await reconciliationService.autoMatch(statementId, req.user.organizationId);
        res.status(200).json({ status: 'success', data: result });
    });

    matchPayment = catchAsync(async (req, res) => {
        const { statementId, entryId, paymentId } = req.body;
        const result = await reconciliationService.matchPayment(statementId, entryId, paymentId, req.user.organizationId);
        res.status(200).json({ status: 'success', data: { result } });
    });
}

module.exports = new ReconciliationController();
