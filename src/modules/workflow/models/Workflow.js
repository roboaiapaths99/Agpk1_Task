const mongoose = require('mongoose');

const transitionSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    allowedRoles: [{ type: String, enum: ['admin', 'manager', 'user'] }],
    conditions: [{ field: String, operator: String, value: mongoose.Schema.Types.Mixed }],
    requiresComment: { type: Boolean, default: false },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
}, { _id: true });

const workflowSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        states: [{
            name: { type: String, required: true },
            type: { type: String, enum: ['initial', 'active', 'side', 'terminal'], default: 'active' },
            color: { type: String, default: '#3b82f6' },
        }],
        transitions: [transitionSchema],
        defaultState: { type: String, required: true },
        sideStates: [{ type: String }], // blocked, escalated, waiting_input
        isActive: { type: Boolean, default: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    },
    { timestamps: true }
);

workflowSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', workflowSchema);
const TransitionLog = require('./TransitionLog');

module.exports = { Workflow, TransitionLog };
