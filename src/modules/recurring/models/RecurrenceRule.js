const mongoose = require('mongoose');
const recurrenceRuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    taskTemplate: {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        tags: [String],
        project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
        estimatedHours: { type: Number, default: null },
    },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'cron'], required: true },
    cronExpression: { type: String, default: null },
    dayOfWeek: { type: Number, default: null }, // 0-6 for weekly
    dayOfMonth: { type: Number, default: null }, // 1-31 for monthly
    nextRunAt: { type: Date, required: true },
    lastRunAt: { type: Date, default: null },
    isPaused: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
}, { timestamps: true });

recurrenceRuleSchema.index({ organizationId: 1, nextRunAt: 1, isPaused: 1 });

module.exports = mongoose.model('RecurrenceRule', recurrenceRuleSchema);
