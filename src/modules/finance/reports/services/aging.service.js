const Invoice = require('../../invoice/models/Invoice');
const Expense = require('../../expenses/models/Expense');
const mongoose = require('mongoose');

class AgingService {
    /**
     * Get Accounts Receivable (AR) Aging Report
     */
    async getReceivableAging(organizationId, filters = {}) {
        const { asOfDate = new Date(), branchId, customerId } = filters;
        const today = new Date(asOfDate);

        const match = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: { $in: ['sent', 'partial', 'overdue'] },
            deletedAt: null
        };

        if (branchId && branchId !== 'all') {
            match.branchId = new mongoose.Types.ObjectId(branchId);
        }
        if (customerId) {
            match.customerId = new mongoose.Types.ObjectId(customerId);
        }

        const aging = await Invoice.aggregate([
            { $match: match },
            {
                $addFields: {
                    daysPastDue: {
                        $cond: {
                            if: { $gt: [today, '$dueDate'] },
                            then: { $floor: { $divide: [{ $subtract: [today, '$dueDate'] }, 86400000] } },
                            else: 0
                        }
                    }
                }
            },
            {
                $addFields: {
                    bucket: {
                        $switch: {
                            branches: [
                                { case: { $lte: ['$daysPastDue', 0] }, then: 'current' },
                                { case: { $lte: ['$daysPastDue', 30] }, then: '1-30' },
                                { case: { $lte: ['$daysPastDue', 60] }, then: '31-60' },
                                { case: { $lte: ['$daysPastDue', 90] }, then: '61-90' },
                                { case: { $lte: ['$daysPastDue', 120] }, then: '91-120' }
                            ],
                            default: '120+'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$customerId',
                    customerName: { $first: '$notes' }, // Temporary, will lookup below
                    totalOutstanding: { $sum: '$totalAmount' },
                    current: { $sum: { $cond: [{ $eq: ['$bucket', 'current'] }, '$totalAmount', 0] } },
                    d30: { $sum: { $cond: [{ $eq: ['$bucket', '1-30'] }, '$totalAmount', 0] } },
                    d60: { $sum: { $cond: [{ $eq: ['$bucket', '31-60'] }, '$totalAmount', 0] } },
                    d90: { $sum: { $cond: [{ $eq: ['$bucket', '61-90'] }, '$totalAmount', 0] } },
                    d120: { $sum: { $cond: [{ $eq: ['$bucket', '91-120'] }, '$totalAmount', 0] } },
                    d120plus: { $sum: { $cond: [{ $eq: ['$bucket', '120+'] }, '$totalAmount', 0] } },
                    invoices: { $push: { _id: '$_id', invoiceNumber: '$invoiceNumber', totalAmount: '$totalAmount', dueDate: '$dueDate', daysPastDue: '$daysPastDue', bucket: '$bucket' } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            { $unwind: '$customerDetails' },
            {
                $project: {
                    customer: {
                        id: '$_id',
                        name: '$customerDetails.name',
                        email: '$customerDetails.email'
                    },
                    totalOutstanding: 1,
                    current: 1,
                    d30: 1,
                    d60: 1,
                    d90: 1,
                    d120: 1,
                    d120plus: 1,
                    invoices: 1
                }
            },
            { $sort: { totalOutstanding: -1 } }
        ]);

        const summary = aging.reduce((acc, curr) => {
            acc.total += curr.totalOutstanding;
            acc.current += curr.current;
            acc.d30 += curr.d30;
            acc.d60 += curr.d60;
            acc.d90 += curr.d90;
            acc.d120 += curr.d120;
            acc.d120plus += curr.d120plus;
            return acc;
        }, { total: 0, current: 0, d30: 0, d60: 0, d90: 0, d120: 0, d120plus: 0 });

        return { summary, details: aging };
    }

    /**
     * Get Accounts Payable (AP) Aging Report
     */
    async getPayableAging(organizationId, filters = {}) {
        const { asOfDate = new Date(), branchId } = filters;
        const today = new Date(asOfDate);

        const match = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: { $in: ['pending', 'approved'] },
            deletedAt: null
        };

        if (branchId && branchId !== 'all') {
            match.branchId = new mongoose.Types.ObjectId(branchId);
        }

        const aging = await Expense.aggregate([
            { $match: match },
            {
                $addFields: {
                    // Use dueDate if exists, else date + 30 days (fallback for legacy)
                    effectiveDueDate: { $ifNull: ['$dueDate', { $add: ['$date', 30 * 24 * 60 * 60 * 1000] }] }
                }
            },
            {
                $addFields: {
                    daysPastDue: {
                        $cond: {
                            if: { $gt: [today, '$effectiveDueDate'] },
                            then: { $floor: { $divide: [{ $subtract: [today, '$effectiveDueDate'] }, 86400000] } },
                            else: 0
                        }
                    }
                }
            },
            {
                $addFields: {
                    bucket: {
                        $switch: {
                            branches: [
                                { case: { $lte: ['$daysPastDue', 0] }, then: 'current' },
                                { case: { $lte: ['$daysPastDue', 30] }, then: '1-30' },
                                { case: { $lte: ['$daysPastDue', 60] }, then: '31-60' },
                                { case: { $lte: ['$daysPastDue', 90] }, then: '61-90' },
                                { case: { $lte: ['$daysPastDue', 120] }, then: '91-120' }
                            ],
                            default: '120+'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$vendor',
                    title: { $first: '$title' },
                    category: { $first: '$category' },
                    totalOutstanding: { $sum: '$amount' },
                    current: { $sum: { $cond: [{ $eq: ['$bucket', 'current'] }, '$amount', 0] } },
                    d30: { $sum: { $cond: [{ $eq: ['$bucket', '1-30'] }, '$amount', 0] } },
                    d60: { $sum: { $cond: [{ $eq: ['$bucket', '31-60'] }, '$amount', 0] } },
                    d90: { $sum: { $cond: [{ $eq: ['$bucket', '61-90'] }, '$amount', 0] } },
                    d120: { $sum: { $cond: [{ $eq: ['$bucket', '91-120'] }, '$amount', 0] } },
                    d120plus: { $sum: { $cond: [{ $eq: ['$bucket', '120+'] }, '$amount', 0] } },
                    expenses: { $push: { _id: '$_id', expenseNumber: '$expenseNumber', title: '$title', amount: '$amount', dueDate: '$effectiveDueDate', daysPastDue: '$daysPastDue' } }
                }
            },
            { $sort: { totalOutstanding: -1 } }
        ]);

        const summary = aging.reduce((acc, curr) => {
            acc.total += curr.totalOutstanding;
            acc.current += curr.current;
            acc.d30 += curr.d30;
            acc.d60 += curr.d60;
            acc.d90 += curr.d90;
            acc.d120 += curr.d120;
            acc.d120plus += curr.d120plus;
            return acc;
        }, { total: 0, current: 0, d30: 0, d60: 0, d90: 0, d120: 0, d120plus: 0 });

        return { summary, details: aging };
    }

    /**
     * Get Dunning List (Overdue follow-up)
     */
    async getDunningList(organizationId, filters = {}) {
        const { branchId } = filters;
        const today = new Date();

        const match = {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            status: { $in: ['sent', 'partial', 'overdue'] },
            dueDate: { $lt: today },
            deletedAt: null
        };

        if (branchId && branchId !== 'all') {
            match.branchId = new mongoose.Types.ObjectId(branchId);
        }

        const dunningList = await Invoice.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$customerId',
                    totalOverdue: { $sum: '$totalAmount' },
                    itemCount: { $sum: 1 },
                    oldestInvoiceDate: { $min: '$dueDate' },
                    invoices: { $push: { _id: '$_id', invoiceNumber: '$invoiceNumber', totalAmount: '$totalAmount', dueDate: '$dueDate' } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            { $unwind: '$customerDetails' },
            {
                $project: {
                    id: '$_id',
                    name: '$customerDetails.name',
                    email: '$customerDetails.email',
                    totalOverdue: 1,
                    itemCount: 1,
                    oldestInvoiceDate: 1,
                    oldestInvoiceDays: {
                        $floor: {
                            $divide: [{ $subtract: [today, '$oldestInvoiceDate'] }, 86400000]
                        }
                    },
                    // Risk Score Algorithm:
                    // 40 pts for age (max at 90 days)
                    // 40 pts for amount (max at 500k)
                    // 20 pts for item count (max at 10 items)
                    riskScore: {
                        $add: [
                            { $min: [40, { $multiply: [{ $divide: [{ $subtract: [today, '$oldestInvoiceDate'] }, 86400000] }, 0.44] }] }, // 40 pts if 90 days old
                            { $min: [40, { $multiply: [{ $divide: ['$totalOverdue', 10000] }, 0.8] }] }, // 40 pts if 500k overdue
                            { $min: [20, { $multiply: ['$itemCount', 2] }] } // 2 pts per item, max 20
                        ]
                    }
                }
            },
            {
                $addFields: {
                    riskScore: { $round: ['$riskScore', 0] }
                }
            },
            { $sort: { riskScore: -1, totalOverdue: -1 } }
        ]);

        return dunningList;

    }
}

module.exports = new AgingService();
