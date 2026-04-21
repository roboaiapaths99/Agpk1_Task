const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Document title is required'],
            trim: true,
            maxlength: 500,
        },
        content: {
            type: String,
            default: '',
        },
        contentType: {
            type: String,
            enum: ['markdown', 'html'],
            default: 'html',
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            default: null,
            index: true,
        },
        parentDocId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
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
        lastEditedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        tags: [{ type: String, trim: true }],
        linkedTasks: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task',
            },
        ],
        isTemplate: {
            type: Boolean,
            default: false,
        },
        templateType: {
            type: String,
            enum: ['prd', 'meeting', 'retro', 'blank', 'design', 'runbook'],
            default: 'blank',
        },
        version: {
            type: Number,
            default: 1,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        icon: {
            type: String,
            default: '📄',
        },
        coverImage: {
            type: String,
            default: null,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for child documents
documentSchema.virtual('children', {
    ref: 'Document',
    localField: '_id',
    foreignField: 'parentDocId',
});

// Indexes
documentSchema.index({ organizationId: 1, projectId: 1 });
documentSchema.index({ organizationId: 1, isTemplate: 1 });
documentSchema.index({ organizationId: 1, parentDocId: 1 });
documentSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema);
