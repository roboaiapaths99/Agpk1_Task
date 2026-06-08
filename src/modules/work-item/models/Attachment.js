const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: false,
            index: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: false,
            index: true,
        },
        type: {
            type: String,
            enum: ['file', 'link'],
            default: 'file',
            required: true,
        },
        url: {
            type: String,
            required: function() { return this.type === 'link'; },
        },
        filename: {
            type: String,
            required: function() { return this.type === 'file'; },
        },
        originalName: {
            type: String,
            required: function() { return this.type === 'file'; },
        },
        mimetype: {
            type: String,
            required: function() { return this.type === 'file'; },
        },
        size: {
            type: Number,
            required: function() { return this.type === 'file'; },
        },
        path: {
            type: String,
            required: function() { return this.type === 'file'; },
        },
        uploadedBy: {
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
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.models.Attachment || mongoose.model('Attachment', attachmentSchema);
