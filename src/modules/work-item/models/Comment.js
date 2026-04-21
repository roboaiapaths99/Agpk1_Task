const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
            index: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: [true, 'Comment content is required'],
            maxlength: 5000,
        },
        mentions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

commentSchema.index({ taskId: 1, createdAt: -1 });

const tenantPlugin = require('../../../core/tenantPlugin');
commentSchema.plugin(tenantPlugin);

module.exports = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
