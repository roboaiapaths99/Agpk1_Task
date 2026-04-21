const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

/**
 * Employee Profile Model
 * Extension of the User model for payroll and HR purposes.
 */
const employeeProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true
        },
        designation: {
            type: String,
            required: true,
            trim: true
        },
        department: {
            type: String,
            required: true,
            trim: true
        },
        hourlyRate: {
            type: Number,
            required: true,
            min: 0,
            comment: 'Standard billing rate per hour for dynamic payroll calculation'
        },
        bankDetails: {
            accountName: { type: String },
            accountNumber: { type: String },
            bankName: { type: String },
            ifscCode: { type: String }
        },
        taxDetails: {
            panNumber: { type: String },
            taxId: { type: String }
        },
        joiningDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['active', 'on_leave', 'terminated'],
            default: 'active'
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

employeeProfileSchema.plugin(tenantPlugin);

module.exports = mongoose.models.EmployeeProfile || mongoose.model('EmployeeProfile', employeeProfileSchema);
