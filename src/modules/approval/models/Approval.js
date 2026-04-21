const mongoose = require('mongoose');

const approvalStepSchema = new mongoose.Schema({
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String },
    order: { type: Number, required: true },
    slaHours: { type: Number, default: 24 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'changes_requested', 'skipped'], default: 'pending' },
    comment: { type: String, default: '' },
    decidedAt: { type: Date, default: null },
});

const approvalChainSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    steps: [approvalStepSchema],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
}, { timestamps: true });

approvalChainSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const approvalRequestSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    chainId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalChain', required: true },
    currentStep: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'in_progress', 'approved', 'rejected', 'changes_requested'], default: 'pending', index: true },
    steps: [approvalStepSchema],
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
}, { timestamps: true });

approvalRequestSchema.index({ organizationId: 1, status: 1 });

const ApprovalChain = mongoose.models.ApprovalChain || mongoose.model('ApprovalChain', approvalChainSchema);
const ApprovalRequest = mongoose.models.ApprovalRequest || mongoose.model('ApprovalRequest', approvalRequestSchema);

module.exports = { ApprovalChain, ApprovalRequest };
