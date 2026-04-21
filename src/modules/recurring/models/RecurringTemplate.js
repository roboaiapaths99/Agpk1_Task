const mongoose = require('mongoose');
const tenantPlugin = require('../../../core/tenantPlugin');

const recurringTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['invoice', 'expense'], required: true },
    
    // For Invoice
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invoiceItems: [{
        description: String,
        quantity: Number,
        price: Number,
        tax: Number
    }],
    
    // For Expenses
    merchant: { type: String },
    category: { type: String },
    amount: { type: Number },
    currency: { type: String, default: 'INR' },
    
    // Recurrence logic
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
    nextRunDate: { type: Date, required: true },
    lastRunDate: { type: Date, default: null },
    status: { type: String, enum: ['active', 'paused'], default: 'active' },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
}, { timestamps: true });

recurringTemplateSchema.plugin(tenantPlugin);
recurringTemplateSchema.index({ organizationId: 1, nextRunDate: 1, status: 1 });

module.exports = mongoose.models.RecurringTemplate || mongoose.model('RecurringTemplate', recurringTemplateSchema);
