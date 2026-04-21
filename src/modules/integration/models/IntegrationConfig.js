const mongoose = require('mongoose');

const integrationConfigSchema = new mongoose.Schema(
    {
        provider: {
            type: String,
            enum: ['github', 'gitlab', 'slack', 'sentry', 'figma', 'zendesk'],
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        config: {
            accessToken: { type: String, default: '' },
            webhookSecret: { type: String, default: '' },
            webhookUrl: { type: String, default: '' },
            repoOwner: { type: String, default: '' },
            repoName: { type: String, default: '' },
            signingSecret: { type: String, default: '' },
            defaultProjectId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Project',
                default: null,
            },
            eventSubscriptions: {
                type: [String],
                default: ['task_created', 'task_completed', 'sprint_completed'],
            },
        },
        connectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        lastSyncAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

integrationConfigSchema.index({ organizationId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.models.IntegrationConfig || mongoose.model('IntegrationConfig', integrationConfigSchema);
