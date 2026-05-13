const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            maxlength: 500,
        },
        description: {
            type: String,
            default: '',
            maxlength: 10000,
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'in_review', 'blocked', 'waiting_input', 'escalated', 'completed', 'cancelled'],
            default: 'open',
            index: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
            index: true,
        },
        assignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        team: {
            type: String,
            default: null,
        },
        watchers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        tags: [
            {
                type: String,
                trim: true,
            },
        ],
        startDate: {
            type: Date,
            default: null,
        },
        dueDate: {
            type: Date,
            default: null,
            index: true,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        slaDeadline: {
            type: Date,
            default: null,
        },
        slaBreached: {
            type: Boolean,
            default: false,
        },
        slaApplied: {
            type: Boolean,
            default: false,
        },
        estimatedHours: {
            type: Number,
            default: 0,
        },
        actualHours: {
            type: Number,
            default: 0,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            default: null,
            index: true,
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            default: null,
        },
        sourceModule: {
            type: String,
            enum: ['CRM', 'HR', 'FINANCE', 'INVENTORY', 'SAFETY', 'AUTOMATION', 'INTERNAL', null],
            default: 'INTERNAL',
        },
        sourceId: {
            type: String,
            default: null,
        },
        workflowId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workflow',
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        key: {
            type: String,
            sparse: true,
            index: true,
        },
        issueType: {
            type: String,
            enum: ['task', 'bug', 'story', 'epic'],
            default: 'task',
            index: true,
        },
        storyPoints: {
            type: Number,
            default: null,
        },
        sprint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Sprint',
            default: null,
            index: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        dependencies: [
            {
                type: { type: String, enum: ['blocks', 'is_blocked_by', 'relates_to'], default: 'is_blocked_by' },
                task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
            }
        ],
        linkedCommits: [
            {
                hash: String,
                message: String,
                author: String,
                url: String,
                timestamp: Date
            }
        ],
        linkedPRs: [
            {
                id: String,
                title: String,
                status: String,
                url: String,
                author: String
            }
        ],
        gitBranch: {
            type: String,
            default: null
        },
        customFields: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for sub-tasks
taskSchema.virtual('children', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'parent',
});

// Compound indexes for common queries
taskSchema.index({ organizationId: 1, status: 1, assignee: 1 });
taskSchema.index({ organizationId: 1, status: 1, dueDate: 1 });
taskSchema.index({ organizationId: 1, project: 1, status: 1 });
taskSchema.index({ organizationId: 1, createdBy: 1, createdAt: -1 });
taskSchema.index({ organizationId: 1, tags: 1 });
taskSchema.index({ organizationId: 1, sourceModule: 1, sourceId: 1 });
taskSchema.index({ organizationId: 1, key: 1 }, { unique: true, sparse: true });

// Text index for search
taskSchema.index({ title: 'text', description: 'text' });

const tenantPlugin = require('../../../core/tenantPlugin');
taskSchema.plugin(tenantPlugin);

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
