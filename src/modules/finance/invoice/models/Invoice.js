const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Usually a Customer/Client from CRM
            required: true,
            index: true
        },
        items: [{
            description: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            unitPrice: { type: Number, required: true }, // Store in cents/paise
            amount: { type: Number, required: true },
            taxRate: { type: Number, default: 0 },
            taxAmount: { type: Number, default: 0 }
        }],
        subtotal: { type: Number, required: true },
        taxAmount: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        status: {
            type: String,
            enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'],
            default: 'draft',
            index: true
        },
        dueDate: { type: Date, required: true },
        issuedDate: { type: Date, default: Date.now },
        sourceType: {
            type: String,
            enum: ['manual', 'task', 'project', 'inventory'],
            default: 'manual'
        },
        sourceId: { type: mongoose.Schema.Types.ObjectId },
        notes: { type: String, default: '' },
        terms: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        attachments: [{
            name: { type: String },
            url: { type: String },
            uploadedAt: { type: Date, default: Date.now }
        }],
        dunningHistory: [{
            stage: { type: Number }, // 1, 2, 3
            sentAt: { type: Date, default: Date.now },
            method: { type: String, enum: ['email', 'slack', 'app'] },
            status: { type: String, enum: ['success', 'failed'], default: 'success' }
        }],
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

// Apply multi-tenancy plugin
invoiceSchema.plugin(tenantPlugin);

// Compound indexes for optimization
invoiceSchema.index({ organizationId: 1, status: 1 });
invoiceSchema.index({ organizationId: 1, customerId: 1 });
invoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
