const Invoice = require('../../invoice/models/Invoice');
const PayrollRun = require('../../payroll/models/PayrollRun');
const Expense = require('../../expenses/models/Expense');
const mongoose = require('mongoose');
const { config } = require('../../../../config');

class ForecastingService {
    /**
     * Predicts revenue and cash flow for the next 6 months
     * @param {string} organizationId 
     * @param {string} branchId 
     */
    async predictRevenueAndCashFlow(organizationId, branchId = null) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);
        const match = { organizationId: orgObjectId, deletedAt: null };
        if (branchId) match.branchId = new mongoose.Types.ObjectId(branchId);

        // 1. Get historical revenue (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const historicalRevenue = await Invoice.aggregate([
            { 
                $match: { 
                    ...match, 
                    status: 'paid',
                    paidAt: { $gte: sixMonthsAgo }
                } 
            },
            {
                $group: {
                    _id: { 
                        year: { $year: '$paidAt' }, 
                        month: { $month: '$paidAt' } 
                    },
                    amount: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // 2. Calculate average monthly revenue
        const totalHistorical = historicalRevenue.reduce((sum, r) => sum + r.amount, 0);
        const avgRevenue = historicalRevenue.length > 0 ? totalHistorical / historicalRevenue.length : 10000; // Default fallback

        // 3. Get fixed costs (Average Payroll + Recurring Expenses)
        const avgPayroll = await PayrollRun.aggregate([
            { $match: { organizationId: orgObjectId, status: { $in: ['processed', 'paid'] } } },
            { $sort: { processedAt: -1 } },
            { $limit: 3 },
            { $group: { _id: null, avg: { $avg: '$totalNet' } } }
        ]);

        const fixedCosts = (avgPayroll[0]?.avg || 0) + 2000; // Base operating cost fallback

        // 4. Project next 6 months
        const forecast = [];
        const growthFactor = config.finance.growthFactor;

        for (let i = 1; i <= 6; i++) {
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + i);
            
            const projectedRevenue = avgRevenue * Math.pow(growthFactor, i);
            const margin = projectedRevenue - fixedCosts;

            forecast.push({
                month: nextDate.toLocaleString('default', { month: 'short' }),
                year: nextDate.getFullYear(),
                amount: Math.max(0, parseFloat(projectedRevenue.toFixed(2))),
                net: Math.max(0, parseFloat(margin.toFixed(2)))
            });
        }

        return forecast;
    }
}

module.exports = new ForecastingService();
