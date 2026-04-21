const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Role name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
        },
        permissions: [
            {
                module: {
                    type: String,
                    required: true,
                    enum: [
                        'TASKS', 'PROJECTS', 'SPRINTS', 'WORKFLOWS',
                        'AUTOMATION', 'APPROVALS', 'OKRS', 'TIME_TRACKING',
                        'DOCS', 'AUDIT_LOGS', 'AI', 'INTEGRATIONS', 'REPORTING',
                        'RESOURCE', 'RECURRING', 'SEARCH', 'ADMIN_PANEL'
                    ],
                },
                access: {
                    type: String,
                    enum: ['NONE', 'READ', 'WRITE', 'ADMIN'],
                    default: 'READ',
                },
            },
        ],
        isSystem: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure unique role names per organization
roleSchema.index({ organizationId: 1, name: 1 }, { unique: true });

// Tenant isolation plugin
const tenantPlugin = require('../../../core/tenantPlugin');
roleSchema.plugin(tenantPlugin);

module.exports = mongoose.models.Role || mongoose.model('Role', roleSchema);
