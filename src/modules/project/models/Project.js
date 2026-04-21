const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning', index: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    keyPrefix: { type: String, uppercase: true, trim: true, default: 'TASK' },
    defaultWorkflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', default: null },
    repositoryUrl: { type: String, default: null },
    webhookSecret: { type: String, default: null },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    metadata: {
        industry: { type: String, default: '' },
        scale: { type: String, enum: ['small', 'medium', 'large', 'enterprise'], default: 'small' },
        businessUnit: { type: String, default: '' },
    },
}, { timestamps: true });

const milestoneSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
}, { timestamps: true });

const dependencySchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    predecessor: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    successor: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    type: { type: String, enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'], default: 'finish_to_start' },
}, { timestamps: true });

dependencySchema.index({ organizationId: 1, predecessor: 1, successor: 1 }, { unique: true });

const tenantPlugin = require('../../../core/tenantPlugin');
projectSchema.plugin(tenantPlugin);
milestoneSchema.plugin(tenantPlugin);
dependencySchema.plugin(tenantPlugin);

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
const Milestone = mongoose.models.Milestone || mongoose.model('Milestone', milestoneSchema);
const Dependency = mongoose.models.Dependency || mongoose.model('Dependency', dependencySchema);

module.exports = { Project, Milestone, Dependency };
