const FinanceSettings = require('../modules/finance/models/FinanceSettings');
const { AppError } = require('../core/errors');
const mongoose = require('mongoose');

/**
 * Middleware to prevent modifications to financial records in locked periods
 */
const checkPeriodLock = async (req, res, next) => {
    try {
        const settings = await FinanceSettings.findOne({ organizationId: req.user.organizationId });
        if (!settings || !settings.lockDate) return next();

        let transactionDate;

        // 1. Check body first (for POST/PUT)
        if (req.body && (req.body.date || req.body.createdAt || req.body.issuedDate)) {
            transactionDate = req.body.date || req.body.createdAt || req.body.issuedDate;
        } 
        // 2. For DELETE/PATCH, lookup record if ID exists
        else if (req.params.id) {
            const id = req.params.id;
            let model;
            
            try {
                // Determine model based on route
                const baseUrl = req.baseUrl || '';
                if (baseUrl.includes('/finance/invoice')) model = mongoose.model('Invoice');
                else if (baseUrl.includes('/finance/expenses')) model = mongoose.model('Expense');
                else if (baseUrl.includes('/finance/payments')) model = mongoose.model('Payment');
                else if (baseUrl.includes('/finance/journal')) model = mongoose.model('JournalEntry');
                else if (baseUrl.includes('/finance/payroll')) model = mongoose.model('PayrollRun');
                else if (baseUrl.includes('/finance/budgets')) model = mongoose.model('Budget');
                else if (baseUrl.includes('/finance/ledger')) model = mongoose.model('LedgerEntry');
                else if (baseUrl.includes('/finance/credit-notes')) model = mongoose.model('CreditNote');
            } catch (modelErr) {
                console.warn(`[PeriodLock] Model lookup failed for ${req.baseUrl}: ${modelErr.message}`);
            }

            if (model) {
                const doc = await model.findOne({ _id: id, organizationId: req.user.organizationId }).lean();
                transactionDate = doc?.date || doc?.createdAt || doc?.issuedDate || doc?.dateOccurred;
            }
        }

        // Default to current date if still not found or invalid
        let finalDate = new Date(transactionDate);
        if (isNaN(finalDate.getTime())) {
            finalDate = new Date();
        }

        if (finalDate <= new Date(settings.lockDate)) {
            return next(new AppError(`${req.method} operations are restricted for this locked financial period (Locked up to: ${new Date(settings.lockDate).toLocaleDateString()})`, 403));
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = checkPeriodLock;

