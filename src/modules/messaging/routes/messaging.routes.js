const express = require('express');
const router = express.Router();
const messagingService = require('../services/messaging.service');
const { authenticate } = require('../../../middlewares/auth');
const { validate } = require('../../../middlewares/validate');
const Joi = require('joi');

// Validators
const messageSchema = Joi.object({
    content: Joi.string().required(),
    attachments: Joi.array().items(Joi.object({
        url: Joi.string().required(),
        name: Joi.string().required()
    }))
});

router.use(authenticate);

router.get('/channels', async (req, res, next) => {
    try {
        const channels = await messagingService.getChannels(req.user.id, req.user.organizationId);
        res.json(channels);
    } catch (err) { next(err); }
});

router.post('/channels', async (req, res, next) => {
    try {
        const channel = await messagingService.createChannel(req.body, req.user.id, req.user.organizationId);
        res.status(201).json(channel);
    } catch (err) { next(err); }
});

router.get('/channels/:channelId/messages', async (req, res, next) => {
    try {
        const messages = await messagingService.getMessages(req.params.channelId, req.user.organizationId, req.query);
        res.json(messages);
    } catch (err) { next(err); }
});

router.post('/channels/:channelId/messages', validate(messageSchema), async (req, res, next) => {
    try {
        const message = await messagingService.sendMessage(req.params.channelId, req.user.id, req.user.organizationId, req.body);
        res.status(201).json(message);
    } catch (err) { next(err); }
});

module.exports = router;
