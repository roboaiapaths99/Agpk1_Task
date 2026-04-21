const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const bankStatementSchema = new mongoose.Schema(
    {
        bankName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        statementDate: { type: Date, required: true },
        entries: [{
            date: { type: Date, required: true },
            description: { type: String, required: true },
            debit: { type: Number, default: 0 },
            credit: { type: Number, default: 0 },
            balance: { type: Number, default: 0 },
            matchedPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null }
        }],
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
            type: String,
            enum: ['draft', 'reconciled', 'partially_reconciled'],
            default: 'draft',
            index: true
        },
        matchingPaymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        },
        reconciledAt: { type: Date },
        reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

bankStatementSchema.plugin(tenantPlugin);

module.exports = mongoose.models.BankStatement || mongoose.model('BankStatement', bankStatementSchema);
