const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

/**
 * Payslip Model
 * Individual salary record for an employee in a payroll run.
 */
const payslipSchema = new mongoose.Schema(
    {
        payrollRunId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PayrollRun',
            required: true,
            index: true
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        employeeProfileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EmployeeProfile',
            required: true
        },
        periodStart: { type: Date, required: true },
        periodEnd: { type: Date, required: true },
        
        // Earnings
        totalHours: { type: Number, default: 0 },
        hourlyRate: { type: Number, required: true },
        basicSalary: { type: Number, required: true },
        overtime: { type: Number, default: 0 },
        bonuses: { type: Number, default: 0 },
        allowances: { type: Number, default: 0 },
        
        // Deductions
        taxDeduction: { type: Number, default: 0 },
        insuranceDeduction: { type: Number, default: 0 },
        otherDeductions: { type: Number, default: 0 },
        
        grossSalary: { type: Number, required: true },
        netSalary: { type: Number, required: true },
        
        status: {
            type: String,
            enum: ['draft', 'generated', 'paid', 'void'],
            default: 'draft'
        },
        pdfUrl: { type: String }, // For generated payslip storage
        paymentReference: { type: String },
        
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

payslipSchema.plugin(tenantPlugin);

module.exports = mongoose.models.Payslip || mongoose.model('Payslip', payslipSchema);
