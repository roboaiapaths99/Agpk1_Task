const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        type: { type: String, enum: ['info', 'warning', 'success', 'error', 'system'], default: 'info' },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
        isRead: { type: Boolean, default: false, index: true },
        link: { type: String, default: '' },
        category: { type: String, enum: ['task', 'workflow', 'approval', 'system', 'automation', 'milestone'], default: 'task' },
        expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 86400000) }, // 30 days default
    },
    { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
