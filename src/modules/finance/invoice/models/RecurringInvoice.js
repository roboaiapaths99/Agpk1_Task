const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const recurringInvoiceSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        templateItems: [{
            description: { type: String, required: true },
            quantity: { type: Number, required: true },
            unitPrice: { type: Number, required: true }
        }],
        frequency: {
            type: String,
            enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
            required: true
        },
        nextRunDate: { type: Date, required: true },
        status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

recurringInvoiceSchema.plugin(tenantPlugin);

module.exports = mongoose.models.RecurringInvoice || mongoose.model('RecurringInvoice', recurringInvoiceSchema);
