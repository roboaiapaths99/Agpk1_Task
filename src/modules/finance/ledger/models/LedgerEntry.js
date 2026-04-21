const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const ledgerEntrySchema = new mongoose.Schema(
    {
        date: { type: Date, default: Date.now, index: true },
        description: { type: String, required: true },
        entries: [{
            accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
            debit: { type: Number, default: 0 },
            credit: { type: Number, default: 0 }
        }],
        sourceType: {
            type: String,
            enum: ['invoice', 'payment', 'expense', 'manual', 'opening_balance', 'payroll', 'tax'],
            required: true
        },
        sourceId: { type: mongoose.Schema.Types.ObjectId }, // ID of the triggering document
        isPosted: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        auditHash: { type: String, index: true }, // Current entry hash
        previousHash: { type: String }, // Hash of the previous entry for this tenant
    },
    { timestamps: true }
);

ledgerEntrySchema.plugin(tenantPlugin);

// Ensure debits = credits validation can be added at service layer
ledgerEntrySchema.index({ organizationId: 1, date: 1 });
ledgerEntrySchema.index({ organizationId: 1, sourceType: 1, sourceId: 1 });

module.exports = mongoose.models.LedgerEntry || mongoose.model('LedgerEntry', ledgerEntrySchema);
