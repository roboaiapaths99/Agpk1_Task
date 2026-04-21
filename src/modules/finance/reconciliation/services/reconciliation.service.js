const BankStatement = require('../models/BankStatement');
const Payment = require('../../payments/models/Payment');
const { AppError } = require('../../../../core/errors');

class ReconciliationService {
    /**
     * Match bank statement entry with an existing payment record
     */
    async matchPayment(statementId, entryId, paymentId, organizationId) {
        const statement = await BankStatement.findOne({ _id: statementId, organizationId });
        if (!statement) throw new AppError('Bank statement not found', 404);

        const entry = statement.entries.id(entryId);
        if (!entry) throw new AppError('Statement entry not found', 404);

        const payment = await Payment.findOne({ _id: paymentId, organizationId });
        if (!payment) throw new AppError('Payment not found', 404);

        // Update entry with match
        entry.matchedPaymentId = paymentId;
        await statement.save();

        return statement;
    }

    async uploadStatement(data, organizationId, userId) {
        const statement = await BankStatement.create({
            ...data,
            organizationId,
            uploadedBy: userId
        });
        return statement;
    }

    /**
     * Process CSV file and return structured entries
     */
    async processCSV(filePath) {
        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const entries = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const entry = {};
            headers.forEach((header, index) => {
                if (header === 'date') entry.date = new Date(values[index]);
                else if (header === 'description') entry.description = values[index];
                else if (header === 'debit') entry.debit = parseFloat(values[index]) || 0;
                else if (header === 'credit') entry.credit = parseFloat(values[index]) || 0;
                else if (header === 'balance') entry.balance = parseFloat(values[index]) || 0;
            });
            return entry;
        });

        return entries;
    }

    /**
     * Auto-match bank statement entries with system payments
     */
    async autoMatch(statementId, organizationId) {
        const statement = await BankStatement.findOne({ _id: statementId, organizationId });
        if (!statement) throw new AppError('Bank statement not found', 404);

        let matchCount = 0;
        const toleranceDays = 3;

        for (const entry of statement.entries) {
            if (entry.matchedPaymentId) continue;

            const amount = entry.credit > 0 ? entry.credit : -entry.debit;
            
            // Search for matching payment
            const startDate = new Date(entry.date);
            startDate.setDate(startDate.getDate() - toleranceDays);
            const endDate = new Date(entry.date);
            endDate.setDate(endDate.getDate() + toleranceDays);

            const potentialMatch = await Payment.findOne({
                organizationId,
                amount: Math.abs(amount),
                paymentDate: { $gte: startDate, $lte: endDate },
                reconciled: false,
                status: 'completed'
            });

            if (potentialMatch) {
                entry.matchedPaymentId = potentialMatch._id;
                potentialMatch.reconciled = true;
                potentialMatch.statementEntryId = entry._id;
                await potentialMatch.save();
                matchCount++;
            }
        }

        if (matchCount > 0) {
            const allMatched = statement.entries.every(e => e.matchedPaymentId);
            statement.status = allMatched ? 'reconciled' : 'partially_reconciled';
            await statement.save();
        }

        return { matchCount, status: statement.status };
    }

    async getStatements(organizationId) {
        return await BankStatement.find({ organizationId }).sort({ statementDate: -1 });
    }
}

module.exports = new ReconciliationService();
