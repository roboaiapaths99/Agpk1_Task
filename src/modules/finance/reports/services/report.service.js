const Invoice = require('../../invoice/models/Invoice');
const Expense = require('../../expenses/models/Expense');
const Account = require('../../ledger/models/Account');
const LedgerEntry = require('../../ledger/models/LedgerEntry');
const mongoose = require('mongoose');

class ReportService {
    /**
     * Get real-time Profit & Loss summary
     */
    async getProfitAndLoss(startDate, endDate, organizationId, branchId = null) {
        const match = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };

        if (branchId && branchId !== 'all') {
            match.branchId = new mongoose.Types.ObjectId(branchId);
        }

        const report = await LedgerEntry.aggregate([
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
                    _id: { type: '$account.type', name: '$account.name' },
                    total: { $sum: { $subtract: ['$entries.debit', '$entries.credit'] } }
                }
            }
        ]);

        const revenueItems = report.filter(r => r._id.type === 'revenue').map(r => ({ category: r._id.name, amount: Math.abs(r.total) }));
        const expenseItems = report.filter(r => r._id.type === 'expense').map(r => ({ category: r._id.name, amount: Math.abs(r.total) }));

        const totalRevenue = revenueItems.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = expenseItems.reduce((sum, i) => sum + i.amount, 0);

        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            revenue: revenueItems,
            expenses: expenseItems,
            period: { startDate, endDate },
            branchId
        };
    }

    async getProjectProfitability(projectId, organizationId) {
        const invoices = await Invoice.find({ organizationId, 'sourceId': projectId, status: { $in: ['paid', 'partial'] } });
        const expenses = await Expense.find({ organizationId, projectId, status: { $in: ['approved', 'paid'] } });

        const revenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const cost = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        return {
            revenue,
            cost,
            profit: revenue - cost,
            margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0
        };
    }

    /**
     * Advanced: Balance Sheet (Snapshot of Assets, Liabilities, Equity)
     */
    async getBalanceSheet(organizationId, branchId = null) {
        const match = { organizationId: new mongoose.Types.ObjectId(organizationId) };
        if (branchId && branchId !== 'all') match.branchId = new mongoose.Types.ObjectId(branchId);

        const summary = await LedgerEntry.aggregate([
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
                    _id: { type: '$account.type', name: '$account.name' },
                    balance: { $sum: { $subtract: ['$entries.debit', '$entries.credit'] } }
                }
            }
        ]);

        const assets = summary.filter(s => s._id.type === 'asset').map(a => ({ name: a._id.name, amount: a.balance }));
        const liabilities = summary.filter(s => s._id.type === 'liability').map(l => ({ name: l._id.name, amount: Math.abs(l.balance) }));
        const equity = summary.filter(s => s._id.type === 'equity').map(e => ({ name: e._id.name, amount: Math.abs(e.balance) }));

        const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
        const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0);

        return {
            assets,
            liabilities,
            equity,
            totalAssets,
            totalLiabilities,
            totalEquity,
            isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
            asOf: new Date(),
            branchId
        };
    }

    /**
     * Get Cash Flow Overview (Actual money in/out)
     */
    async getCashFlow(organizationId, branchId = null) {
        const match = { 
            organizationId: new mongoose.Types.ObjectId(organizationId)
        };
        if (branchId && branchId !== 'all') match.branchId = new mongoose.Types.ObjectId(branchId);

        // Track movements in Cash/Bank accounts (Asset type, typically starting with 10)
        const cashFlow = await LedgerEntry.aggregate([
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
            { $match: { 'account.type': 'asset', 'account.name': { $regex: /cash|bank/i } } },
            {
                $group: {
                    _id: { 
                        month: { $month: '$date' },
                        year: { $year: '$date' }
                    },
                    inflow: { $sum: '$entries.debit' },
                    outflow: { $sum: '$entries.credit' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } }
        ]);

        return {
            data: cashFlow.map(cf => ({
                period: `${cf._id.month}/${cf._id.year}`,
                inflow: cf.inflow,
                outflow: cf.outflow,
                net: cf.inflow - cf.outflow
            })),
            timestamp: new Date()
        };
    }

    /**
     * Get revenue breakdown by project
     */
    async getRevenueByProject(organizationId, branchId = null) {
        const match = { 
            organizationId: new mongoose.Types.ObjectId(organizationId), 
            sourceType: 'project' 
        };
        if (branchId && branchId !== 'all') match.branchId = new mongoose.Types.ObjectId(branchId);

        return await Invoice.aggregate([
            { $match: match },
            { $group: { _id: '$sourceId', totalRevenue: { $sum: '$totalAmount' } } },
            { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'projectInfo' } }
        ]);
    }
}

module.exports = new ReportService();
