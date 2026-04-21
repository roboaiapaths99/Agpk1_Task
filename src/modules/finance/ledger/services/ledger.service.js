const Account = require('../models/Account');
const LedgerEntry = require('../models/LedgerEntry');
const { AppError } = require('../../../../core/errors');

class LedgerService {
    /**
     * Post a double-entry transaction
     * entries: [{ accountCode: '1001', debit: 100, credit: 0 }, { accountCode: '2001', debit: 0, credit: 100 }]
     */
    async postTransaction(data, organizationId, userId) {
        const { description, entries, sourceType, sourceId, branchId } = data;

        // 1. Validate Double Entry (Debits must equal Credits)
        const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);

        if (totalDebit !== totalCredit) {
            throw new AppError('Accounting Error: Total Debits must equal Total Credits', 400);
        }

        // 2. Map account codes to IDs and update balances
        const processedEntries = [];
        for (const entry of entries) {
            const account = await Account.findOne({ code: entry.accountCode, organizationId });
            if (!account) throw new AppError(`Account ${entry.accountCode} not found`, 404);

            // Update Account Balance
            // Asset/Expense: Debit increases, Credit decreases
            // Liability/Equity/Revenue: Credit increases, Debit decreases
            const change = (['asset', 'expense'].includes(account.type))
                ? (entry.debit - entry.credit)
                : (entry.credit - entry.debit);

            account.balance += (change || 0);
            await account.save();

            processedEntries.push({
                accountId: account._id,
                debit: entry.debit,
                credit: entry.credit
            });
        }

        // 3. Automated Integrity Hashing (Audit Sentinel)
        const crypto = require('crypto');
        const lastEntry = await LedgerEntry.findOne({ organizationId }).sort({ createdAt: -1 });
        const previousHash = lastEntry ? lastEntry.auditHash : 'GENESIS';

        const hashData = {
            description,
            entries: processedEntries,
            sourceType,
            sourceId,
            organizationId,
            branchId,
            previousHash
        };

        const auditHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(hashData))
            .digest('hex');

        // 4. Create Ledger Entry
        const ledgerEntry = await LedgerEntry.create({
            description,
            entries: processedEntries,
            sourceType,
            sourceId,
            organizationId,
            branchId,
            createdBy: userId,
            auditHash,
            previousHash
        });

        return ledgerEntry;
    }

    async getAccountBalance(code, organizationId) {
        const account = await Account.findOne({ code, organizationId });
        return account ? account.balance : 0;
    }

    async getTrialBalance(organizationId) {
        return await Account.find({ organizationId }).select('code name type balance');
    }
}

module.exports = new LedgerService();
