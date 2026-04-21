const mongoose = require('mongoose');

const slaPolicySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Policy name is required'],
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            required: true
        },
        responseTimeLimit: {
            type: Number, // In hours
            required: true,
            min: 0
        },
        resolutionTimeLimit: {
            type: Number, // In hours
            required: true,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// Plugin for tenant isolation
const tenantPlugin = require('../../../core/tenantPlugin');
slaPolicySchema.plugin(tenantPlugin);

module.exports = mongoose.models.SLAPolicy || mongoose.model('SLAPolicy', slaPolicySchema);
