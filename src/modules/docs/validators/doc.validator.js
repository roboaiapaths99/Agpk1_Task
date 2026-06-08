const Joi = require('joi');

const createDocSchema = Joi.object({
    title: Joi.string().trim().max(500),
    content: Joi.string().allow(''),
    contentType: Joi.string().valid('markdown', 'html'),
    projectId: Joi.string().hex().length(24).allow(null),
    parentDocId: Joi.string().hex().length(24).allow(null),
    templateType: Joi.string().valid('prd', 'meeting', 'retro', 'blank', 'design', 'runbook').allow(null, ''),
    isTemplate: Joi.boolean(),
    icon: Joi.string().max(50).allow('', null),
    coverImage: Joi.string().allow(null, ''),
    sortOrder: Joi.number().integer(),
});

const updateDocSchema = Joi.object({
    title: Joi.string().trim().max(500),
    content: Joi.string().allow(''),
    contentType: Joi.string().valid('markdown', 'html'),
    projectId: Joi.string().hex().length(24).allow(null),
    parentDocId: Joi.string().hex().length(24).allow(null),
    isTemplate: Joi.boolean(),
    templateType: Joi.string().valid('prd', 'meeting', 'retro', 'blank', 'design', 'runbook').allow(null, ''),
    icon: Joi.string().max(50).allow('', null),
    coverImage: Joi.string().allow(null, ''),
    sortOrder: Joi.number().integer(),
    isArchived: Joi.boolean(),
}).min(1);

const linkTaskSchema = Joi.object({
    taskId: Joi.string().hex().length(24).required(),
});

module.exports = {
    createDocSchema,
    updateDocSchema,
    linkTaskSchema,
};
