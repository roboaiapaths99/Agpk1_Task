const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        triggerEvent: { type: String, required: true, index: true },
        conditions: [{
            field: { type: String, required: true },
            operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'in', 'not_in'], required: true },
            value: { type: mongoose.Schema.Types.Mixed, required: true },
        }],
        actions: [{
            type: { type: String, enum: ['create_task', 'update_task', 'assign_task', 'notify', 'change_status', 'escalate', 'add_tag'], required: true },
            config: { type: mongoose.Schema.Types.Mixed, default: {} },
        }],
        isActive: { type: Boolean, default: true },
        executionCount: { type: Number, default: 0 },
        lastExecuted: { type: Date, default: null },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

automationRuleSchema.index({ organizationId: 1, isActive: 1, triggerEvent: 1 });

module.exports = mongoose.models.AutomationRule || mongoose.model('AutomationRule', automationRuleSchema);
