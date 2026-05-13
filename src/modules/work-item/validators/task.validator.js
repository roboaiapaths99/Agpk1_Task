const Joi = require('joi');

const createTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).max(500).required(),
    description: Joi.string().max(10000).allow(''),
    status: Joi.string().valid('open', 'in_progress', 'in_review', 'blocked', 'waiting_input', 'escalated', 'completed', 'cancelled'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    assignee: Joi.string().hex().length(24).allow(null),
    team: Joi.string().max(100).allow(null, ''),
    watchers: Joi.array().items(Joi.string().hex().length(24)),
    tags: Joi.array().items(Joi.string().trim().max(50)),
    startDate: Joi.date().iso().allow(null),
    dueDate: Joi.date().iso().allow(null),
    slaDeadline: Joi.date().iso().allow(null),
    estimatedHours: Joi.number().min(0).allow(null),
    project: Joi.string().hex().length(24).allow(null),
    parent: Joi.string().hex().length(24).allow(null),
    sourceModule: Joi.string().valid('CRM', 'HR', 'FINANCE', 'INVENTORY', 'SAFETY', 'AUTOMATION', 'INTERNAL').allow(null),
    sourceId: Joi.string().allow(null, ''),
    workflowId: Joi.string().hex().length(24).allow(null),
});

const updateTaskSchema = Joi.object({
    title: Joi.string().trim().min(1).max(500),
    description: Joi.string().max(10000).allow(''),
    status: Joi.string().valid('open', 'in_progress', 'in_review', 'blocked', 'waiting_input', 'escalated', 'completed', 'cancelled'),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    assignee: Joi.string().hex().length(24).allow(null),
    team: Joi.string().max(100).allow(null, ''),
    tags: Joi.array().items(Joi.string().trim().max(50)),
    startDate: Joi.date().iso().allow(null),
    dueDate: Joi.date().iso().allow(null),
    slaDeadline: Joi.date().iso().allow(null),
    estimatedHours: Joi.number().min(0).allow(null),
    isArchived: Joi.boolean(),
}).min(1);

const assignTaskSchema = Joi.object({
    assigneeId: Joi.string().hex().length(24).required(),
});

const changeStatusSchema = Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'in_review', 'blocked', 'waiting_input', 'escalated', 'completed', 'cancelled').required(),
});

const addCommentSchema = Joi.object({
    content: Joi.string().min(1).max(5000).required(),
    mentions: Joi.array().items(Joi.string().hex().length(24)),
    parentComment: Joi.string().hex().length(24).allow(null),
});

const addChecklistSchema = Joi.object({
    title: Joi.string().max(200),
    items: Joi.array().items(Joi.object({
        title: Joi.string().required().max(500),
        completed: Joi.boolean(),
        assignee: Joi.string().hex().length(24).allow(null),
        children: Joi.array().items(Joi.object({ title: Joi.string().required(), completed: Joi.boolean() })),
    })),
});

const updateChecklistItemSchema = Joi.object({
    title: Joi.string().max(500),
    completed: Joi.boolean(),
    assignee: Joi.string().hex().length(24).allow(null),
}).min(1);

const bulkCreateSchema = Joi.object({
    tasks: Joi.array().items(createTaskSchema).min(1).max(100).required(),
});

module.exports = {
    createTaskSchema,
    updateTaskSchema,
    assignTaskSchema,
    changeStatusSchema,
    addCommentSchema,
    addChecklistSchema,
    updateChecklistItemSchema,
    bulkCreateSchema,
};
