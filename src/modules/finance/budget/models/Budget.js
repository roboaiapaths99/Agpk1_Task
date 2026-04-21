const mongoose = require('mongoose');
const tenantPlugin = require('../../../../core/tenantPlugin');

const budgetSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        category: { 
            type: String, 
            index: true,
            comment: 'Optional category specific budget. If null, applies to all categories.'
        },
        allocatedAmount: { 
            type: Number, 
            required: true,
            min: 0
        },
        spentAmount: { 
            type: Number, 
            default: 0 
        },
        currency: { 
            type: String, 
            default: 'INR' 
        },
        startDate: { 
            type: Date, 
            required: true,
            index: true
        },
        endDate: { 
            type: Date, 
            required: true,
            index: true
        },
        alertThreshold: { 
            type: Number, 
            default: 80,
            comment: 'Percentage threshold to trigger alerts'
        },
        status: {
            type: String,
            enum: ['active', 'closed', 'paused'],
            default: 'active'
        },
        description: { 
            type: String, 
            trim: true 
        },
        branchId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Branch' 
        },
        organizationId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Organization', 
            required: true, 
            index: true 
        },
        createdBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }
    },
    { timestamps: true }
);

// Apply multi-tenancy plugin
budgetSchema.plugin(tenantPlugin);

// Compound indexes for event matching
budgetSchema.index({ organizationId: 1, category: 1, startDate: 1, endDate: 1, status: 1 });

module.exports = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
