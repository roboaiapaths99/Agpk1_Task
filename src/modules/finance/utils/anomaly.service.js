const LedgerEntry = require('../ledger/models/LedgerEntry');
const mongoose = require('mongoose');

class AnomalyDetectionService {
    /**
     * Scan for unusual expense patterns for a given organization
     */
    async detectAnomalies(organizationId, branchId = null) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const match = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            date: { $gte: thirtyDaysAgo }
        };
        if (branchId) match.branchId = new mongoose.Types.ObjectId(branchId);

        // 1. Get recent expenses aggregated by entry document
        const recentExpenses = await LedgerEntry.aggregate([
            { $match: match },
            { $unwind: '$entries' },
            {
                $lookup: {
                    from: 'accounts',
                    localField: 'entries.accountId',
                    foreignField: '_id',
                    as: 'account'
                }
            },
            { $unwind: '$account' },
            { $match: { 'account.type': 'expense' } },
            {
                $group: {
                    _id: '$_id',
                    description: { $first: '$description' },
                    totalDebit: { $sum: '$entries.debit' },
                    date: { $first: '$date' }
                }
            }
        ]);

        if (recentExpenses.length < 5) return [];

        const total = recentExpenses.reduce((sum, e) => sum + e.totalDebit, 0);
        const average = total / recentExpenses.length;
        const threshold = average * 3;

        const anomalies = recentExpenses.filter(e => e.totalDebit > threshold).map(e => ({
            type: 'LARGE_TRANSACTION',
            description: `Transaction of ${e.totalDebit} ("${e.description}") is significantly higher than average (${average.toFixed(2)})`,
            referenceId: e._id,
            amount: e.totalDebit,
            severity: 'medium'
        }));

        return anomalies;
    }

    /**
     * AI-Driven Categorization Hint
     */
    async suggestCategory(description) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('aws') || lowerDesc.includes('azure') || lowerDesc.includes('server')) return 'Software/Cloud';
        if (lowerDesc.includes('salary') || lowerDesc.includes('payroll')) return 'Salaries & Wages';
        if (lowerDesc.includes('uber') || lowerDesc.includes('flight') || lowerDesc.includes('hotel')) return 'Travel';
        if (lowerDesc.includes('office') || lowerDesc.includes('stationary')) return 'Office Supplies';

        return 'General Expense';
    }
}

module.exports = new AnomalyDetectionService();
