const Account = require('../../ledger/models/Account');
const Invoice = require('../../invoice/models/Invoice');
const Expense = require('../../expenses/models/Expense');
const PayrollRun = require('../../payroll/models/PayrollRun');
const AnomalyService = require('../../utils/anomaly.service');
const LedgerEntry = require('../../ledger/models/LedgerEntry');
const ForecastingService = require('./forecasting.service');
const mongoose = require('mongoose');

class FinancialDashboardService {
    async getBusinessHealthSummary(organizationId, branchId = null) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);
        const match = { organizationId: orgObjectId };
        if (branchId) match.branchId = new mongoose.Types.ObjectId(branchId);

        // 1. Get Core Balances from Ledger
        const ledgerSummary = await LedgerEntry.aggregate([
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
            {
                $group: {
                    _id: '$account.type',
                    balance: { $sum: { $subtract: ['$entries.debit', '$entries.credit'] } }
                }
            }
        ]);

        const balances = {
            cash: Math.abs(ledgerSummary.find(s => s._id === 'asset')?.balance || 0),
            revenue: Math.abs(ledgerSummary.find(s => s._id === 'revenue')?.balance || 0),
            expense: Math.abs(ledgerSummary.find(s => s._id === 'expense')?.balance || 0),
            liabilities: Math.abs(ledgerSummary.find(s => s._id === 'liability')?.balance || 0)
        };

        // 2. Real-time Invoice Metrics
        const invoiceStats = await Invoice.aggregate([
            { $match: { organizationId: orgObjectId, deletedAt: null } },
            {
                $group: {
                    _id: null,
                    totalInvoiced: { $sum: '$totalAmount' },
                    paidAmount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalAmount', 0] } },
                    overdueAmount: { 
                        $sum: { 
                            $cond: [
                                { $and: [{ $ne: ['$status', 'paid'] }, { $lt: ['$dueDate', new Date()] }] }, 
                                '$totalAmount', 
                                0 
                             ] 
                        } 
                    },
                    overdueCount: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'paid'] }, { $lt: ['$dueDate', new Date()] }] }, 1, 0] } }
                }
            }
        ]);

        const invMetrics = invoiceStats[0] || { totalInvoiced: 0, paidAmount: 0, overdueAmount: 0, overdueCount: 0 };

        // 3. Payroll Metrics
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const payrollSummary = await PayrollRun.aggregate([
            { 
                $match: { 
                    organizationId: orgObjectId, 
                    status: { $in: ['processed', 'paid'] },
                    paymentDate: { $gte: startOfYear }
                } 
            },
            { $group: { _id: null, totalDisbursed: { $sum: '$totalNet' } } }
        ]);

        // 4. Forecast Data
        const forecast = await ForecastingService.predictRevenueAndCashFlow(organizationId, branchId);

        // 5. Anomaly Analysis
        const anomalies = await AnomalyService.detectAnomalies(organizationId, branchId);

        // 6. Harmonize Keys for Frontend
        return {
            metrics: {
                liquidCash: balances.cash,
                monthlyBurn: balances.expense / (new Date().getDate() || 1) * 30, // Monthly normalized
                receivables: invMetrics.totalInvoiced - invMetrics.paidAmount,
                totalPayroll: payrollSummary[0]?.totalDisbursed || 0,
                revenue: balances.revenue,
                expense: balances.expense,
                liabilities: balances.liabilities,
                liquidityRatio: balances.liabilities > 0 ? parseFloat((balances.cash / balances.liabilities).toFixed(2)) : 100
            },
            forecast: forecast,
            alerts: {
                overdueCount: invMetrics.overdueCount,
                anomalyCount: anomalies.length,
                anomalies: anomalies.slice(0, 5)
            },
            timestamp: new Date()
        };
    }
}

module.exports = new FinancialDashboardService();
