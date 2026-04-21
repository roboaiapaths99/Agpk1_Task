const Joi = require('joi');

const notificationSchema = Joi.object({
    title: Joi.string().required().max(200),
    message: Joi.string().required().max(1000),
    type: Joi.string().valid('info', 'warning', 'success', 'error', 'system'),
    category: Joi.string().valid('task', 'workflow', 'approval', 'system', 'automation', 'milestone'),
    link: Joi.string().allow(''),
    data: Joi.object(),
});

module.exports = { notificationSchema };
