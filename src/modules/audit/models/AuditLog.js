const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    module: {
        type: String,
        required: true,
        index: true
    },
    entityType: {
        type: String,
        index: true
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success',
        index: true
    },
    entityId: {
        type: String,
        index: true
    },
    oldData: {
        type: mongoose.Schema.Types.Mixed
    },
    newData: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    changes: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
    }],
    hash: {
        type: String,
        index: true
    },
    previousHash: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
