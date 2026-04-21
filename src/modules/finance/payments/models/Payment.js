const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const paymentSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
            index: true
        },
        amount: { type: Number, required: true }, // Store in cents/paise
        paymentDate: { type: Date, default: Date.now },
        method: {
            type: String,
            enum: ['cash', 'bank', 'upi', 'card', 'cheque', 'other'],
            required: true
        },
        reference: { type: String, trim: true }, // Transaction ID, Cheque No, etc.
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'completed',
            index: true
        },
        notes: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        attachments: [{
            name: { type: String },
            url: { type: String },
            uploadedAt: { type: Date, default: Date.now }
        }],
        reconciled: { type: Boolean, default: false, index: true },
        statementEntryId: { type: mongoose.Schema.Types.ObjectId },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

// Apply multi-tenancy plugin
paymentSchema.plugin(tenantPlugin);

// Compound indexes
paymentSchema.index({ organizationId: 1, invoiceId: 1 });
paymentSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
