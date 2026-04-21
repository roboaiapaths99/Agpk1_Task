const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Field name is required'],
            trim: true,
        },
        fieldType: {
            type: String,
            enum: ['text', 'number', 'date', 'dropdown', 'checkbox', 'url', 'user', 'currency'],
            required: true,
        },
        options: [
            {
                label: String,
                value: String,
                color: { type: String, default: '#64748b' },
            },
        ],
        defaultValue: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        isRequired: {
            type: Boolean,
            default: false,
        },
        appliesTo: {
            type: String,
            enum: ['task', 'project', 'all'],
            default: 'task',
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            default: null,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

customFieldSchema.index({ organizationId: 1, projectId: 1 });
customFieldSchema.index({ organizationId: 1, appliesTo: 1 });

module.exports = mongoose.models.CustomField || mongoose.model('CustomField', customFieldSchema);
