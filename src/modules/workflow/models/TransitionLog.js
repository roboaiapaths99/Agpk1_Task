const mongoose = require('mongoose');

const transitionLogSchema = new mongoose.Schema(
    {
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
        workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
        fromState: { type: String, required: true },
        toState: { type: String, required: true },
        triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        reason: { type: String, default: '' },
    },
    { timestamps: true }
);

transitionLogSchema.index({ organizationId: 1, taskId: 1, createdAt: -1 });

module.exports = mongoose.models.TransitionLog || mongoose.model('TransitionLog', transitionLogSchema);
