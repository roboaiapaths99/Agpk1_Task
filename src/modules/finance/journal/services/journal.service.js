const LedgerEntry = require('../../ledger/models/LedgerEntry');
const ledgerService = require('../../ledger/services/ledger.service');
const { AppError } = require('../../../../core/errors');

class JournalService {
    /**
     * Create a manual journal entry
     */
    async createJournalEntry(data, organizationId, userId) {
        const { isReversing, reversalDate, ...ledgerData } = data;

        // 1. Post the main transaction via ledgerService
        // Set sourceType to manual for journal entries
        const mainEntry = await ledgerService.postTransaction(
            { ...ledgerData, sourceType: 'manual' },
            organizationId,
            userId
        );

        // 2. Handle Reversal if requested
        if (isReversing && reversalDate) {
            // In a real system, this might be scheduled via a worker (BullMQ/Agenda)
            // For now, we'll implement the reversal logic that can be triggered
            // or we could auto-create it as a 'scheduled' or 'future' entry
            // The plan says "auto-create a reversal entry on reversalDate"
            // We will create it now but with the future date
            
            const reversalEntries = ledgerData.entries.map(entry => ({
                accountCode: entry.accountCode,
                debit: entry.credit, // Swap debit and credit
                credit: entry.debit
            }));

            await ledgerService.postTransaction(
                {
                    description: `Reversal of [${mainEntry.description}]`,
                    date: reversalDate,
                    entries: reversalEntries,
                    sourceType: 'manual',
                    sourceId: mainEntry._id
                },
                organizationId,
                userId
            );
        }

        return mainEntry;
    }

    /**
     * Get all journal entries (manual only)
     */
    async getJournalEntries(organizationId, filters = {}) {
        const query = { organizationId, sourceType: 'manual' };

        if (filters.startDate && filters.endDate) {
            query.date = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
        }

        if (filters.branchId) {
            query.branchId = filters.branchId;
        }

        if (filters.search) {
            query.description = { $regex: filters.search, $options: 'i' };
        }

        const entries = await LedgerEntry.find(query)
            .populate('entries.accountId', 'code name type')
            .populate('createdBy', 'firstName lastName')
            .sort({ date: -1, createdAt: -1 });

        return entries;
    }

    /**
     * Get a single journal entry
     */
    async getJournalEntryById(id, organizationId) {
        const entry = await LedgerEntry.findOne({ _id: id, organizationId, sourceType: 'manual' })
            .populate('entries.accountId', 'code name type')
            .populate('createdBy', 'firstName lastName');

        if (!entry) throw new AppError('Journal entry not found', 404);
        return entry;
    }

    /**
     * Reverse an entry manually
     */
    async reverseEntry(id, organizationId, userId) {
        const entry = await this.getJournalEntryById(id, organizationId);
        
        const reversalEntries = entry.entries.map(e => ({
            accountCode: e.accountId.code,
            debit: e.credit,
            credit: e.debit
        }));

        return await ledgerService.postTransaction(
            {
                description: `Manual Reversal of [${entry.description}]`,
                date: new Date(),
                entries: reversalEntries,
                sourceType: 'manual',
                sourceId: entry._id
            },
            organizationId,
            userId
        );
    }

    /**
     * Void an entry
     */
    async voidEntry(id, organizationId, userId) {
        const entry = await LedgerEntry.findOne({ _id: id, organizationId });
        if (!entry) throw new AppError('Entry not found', 404);

        if (!entry.isPosted) throw new AppError('Entry is already voided', 400);

        // 1. Mark as voided
        entry.isPosted = false;
        
        // 2. Reverse account balances
        // We need to fetch the accounts and reverse the impact
        const Account = require('../../ledger/models/Account');
        for (const line of entry.entries) {
            const account = await Account.findById(line.accountId);
            if (!account) continue;

            const change = (['asset', 'expense'].includes(account.type))
                ? (line.debit - line.credit)
                : (line.credit - line.debit);

            account.balance -= (change || 0); // Subtracting the original change
            await account.save();
        }

        entry.description = `[VOIDED] ${entry.description}`;
        await entry.save();

        return entry;
    }
}

module.exports = new JournalService();
