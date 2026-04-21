const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const creditNoteSchema = new mongoose.Schema(
    {
        noteNumber: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice',
            required: true
        },
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        status: {
            type: String,
            enum: ['draft', 'issued', 'void'],
            default: 'draft'
        },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        branchId: { type: String, index: true },
        attachments: [{
            name: String,
            url: String,
            type: { type: String }
        }],
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

creditNoteSchema.plugin(tenantPlugin);
creditNoteSchema.index({ organizationId: 1, noteNumber: 1 }, { unique: true });

module.exports = mongoose.models.CreditNote || mongoose.model('CreditNote', creditNoteSchema);
