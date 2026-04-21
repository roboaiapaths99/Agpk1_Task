const mongoose = require('mongoose');

const documentVersionSchema = new mongoose.Schema(
    {
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            required: true,
            index: true,
        },
        version: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        createdBy: {
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

documentVersionSchema.index({ documentId: 1, version: -1 });

module.exports = mongoose.models.DocumentVersion || mongoose.model('DocumentVersion', documentVersionSchema);
