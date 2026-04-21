const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

/**
 * Payroll Run Model
 * Represents a batch of payroll processing for a specific period.
 */
const payrollRunSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            placeholder: 'e.g., April 2024 Monthly Payroll'
        },
        periodStart: {
            type: Date,
            required: true
        },
        periodEnd: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['draft', 'processed', 'paid', 'cancelled'],
            default: 'draft'
        },
        totalGross: {
            type: Number,
            default: 0
        },
        totalNet: {
            type: Number,
            default: 0
        },
        employeeCount: {
            type: Number,
            default: 0
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        paymentDate: {
            type: Date
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

payrollRunSchema.plugin(tenantPlugin);

module.exports = mongoose.models.PayrollRun || mongoose.model('PayrollRun', payrollRunSchema);
