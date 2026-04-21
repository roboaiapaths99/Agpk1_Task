const mongoose = require('mongoose');

const taskCreationRuleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        triggerEvent: { type: String, required: true, index: true },
        conditions: [{
            field: { type: String, required: true },
            operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'gt', 'lt', 'in'], required: true },
            value: { type: mongoose.Schema.Types.Mixed, required: true },
        }],
        taskTemplate: {
            title: { type: String, required: true },
            description: { type: String, default: '' },
            priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
            assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            tags: [String],
            dueDateOffset: { type: Number, default: null }, // days from now
            sourceModule: { type: String, default: 'AUTOMATION' },
        },
        slaAutoAssign: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TaskCreationRule', taskCreationRuleSchema);
