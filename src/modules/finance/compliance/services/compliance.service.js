const FinanceSettings = require('../../models/FinanceSettings');
const LedgerEntry = require('../../ledger/models/LedgerEntry');
const crypto = require('crypto');
const { AppError } = require('../../../../core/errors');

class ComplianceService {
    /**
     * Get finance settings for an organization
     */
    async getSettings(organizationId) {
        let settings = await FinanceSettings.findOne({ organizationId });
        if (!settings) {
            settings = await FinanceSettings.create({ organizationId });
        }
        return settings;
    }

    /**
     * Update the period lock date
     */
    async updateLockDate(organizationId, lockDate) {
        const settings = await this.getSettings(organizationId);
        settings.lockDate = lockDate;
        await settings.save();
        return settings;
    }

    /**
     * Verify the integrity of the ledger chain
     */
    async verifyLedgerIntegrity(organizationId) {
        const entries = await LedgerEntry.find({ organizationId }).sort({ createdAt: 1 });
        const results = {
            totalChecked: entries.length,
            validCount: 0,
            invalidCount: 0,
            breaches: []
        };

        let currentPreviousHash = 'GENESIS';

        for (const entry of entries) {
            const hashData = {
                description: entry.description,
                entries: entry.entries.map(e => ({
                    accountId: e.accountId,
                    debit: e.debit,
                    credit: e.credit
                })),
                sourceType: entry.sourceType,
                sourceId: entry.sourceId,
                organizationId: entry.organizationId,
                branchId: entry.branchId,
                previousHash: entry.previousHash
            };

            const calculatedHash = crypto
                .createHash('sha256')
                .update(JSON.stringify(hashData))
                .digest('hex');

            const isHashValid = calculatedHash === entry.auditHash;
            const isChainValid = entry.previousHash === currentPreviousHash;

            if (isHashValid && isChainValid) {
                results.validCount++;
            } else {
                results.invalidCount++;
                results.breaches.push({
                    entryId: entry._id,
                    description: entry.description,
                    expectedPreviousHash: currentPreviousHash,
                    actualPreviousHash: entry.previousHash,
                    hashMismatch: !isHashValid,
                    chainMismatch: !isChainValid
                });
            }

            currentPreviousHash = entry.auditHash;
        }

        return results;
    }
}

module.exports = new ComplianceService();
