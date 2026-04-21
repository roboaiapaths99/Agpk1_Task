const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const expenseSchema = new mongoose.Schema(
    {
        expenseNumber: { type: String, unique: true, sparse: true, index: true },
        title: { type: String, trim: true },
        merchant: { type: String, trim: true },
        category: { type: String, required: true },
        amount: { type: Number, required: true },
        taxAmount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' },
        date: { type: Date, default: Date.now },
        dueDate: { type: Date }, // Added for AP aging
        vendor: { type: String, trim: true },
        description: { type: String, default: '' },
        paymentMethod: { type: String, default: 'Bank Transfer' },
        referenceNumber: { type: String, default: '' },
        attachments: [{
            name: { type: String },
            url: { type: String },
            type: { type: String }
        }],
        status: {
            type: String,
            enum: ['draft', 'pending', 'pending_approval', 'approved', 'rejected', 'paid'],
            default: 'pending',
            index: true
        },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvalDate: { type: Date },
        notes: { type: String, default: '' },
        billable: { type: Boolean, default: false },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

expenseSchema.plugin(tenantPlugin);

expenseSchema.index({ organizationId: 1, status: 1 });
expenseSchema.index({ organizationId: 1, category: 1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
