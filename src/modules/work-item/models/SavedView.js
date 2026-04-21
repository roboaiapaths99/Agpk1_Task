const mongoose = require('mongoose');

const savedViewSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, maxlength: 200 },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        filters: { type: mongoose.Schema.Types.Mixed, default: {} },
        groupBy: { type: String, default: null },
        sortBy: { type: String, default: '-createdAt' },
        columns: [{ type: String }],
        viewType: { type: String, enum: ['kanban', 'list', 'calendar', 'timeline'], default: 'list' },
        isShared: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.models.SavedView || mongoose.model('SavedView', savedViewSchema);
