const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 500 },
    completed: { type: Boolean, default: false },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    children: [
        {
            title: { type: String, required: true },
            completed: { type: Boolean, default: false },
        },
    ],
});

const checklistSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
            index: true,
        },
        title: {
            type: String,
            default: 'Checklist',
            maxlength: 200,
        },
        items: [checklistItemSchema],
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

const tenantPlugin = require('../../../core/tenantPlugin');
checklistSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Checklist', checklistSchema);
