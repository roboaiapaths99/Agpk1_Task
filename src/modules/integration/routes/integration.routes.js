const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middlewares/auth');
const { authorize } = require('../../../middlewares/rbac');
const githubService = require('../services/github.service');
const slackService = require('../services/slack.service');
const figmaService = require('../services/figma.service');
const IntegrationConfig = require('../models/IntegrationConfig');
const { success } = require('../../../utils/response');

// ─── Authenticated Routes ───────────────────────────────────
router.use('/github/connect', authenticate);
router.use('/github/disconnect', authenticate);
router.use('/github/status', authenticate);
router.use('/slack', authenticate);
router.use('/figma', authenticate);
router.use('/status', authenticate);

// GitHub
router.post('/github/connect', async (req, res, next) => {
    try {
        const result = await githubService.connect({
            organizationId: req.user.organizationId,
            accessToken: req.body.accessToken,
            repoOwner: req.body.repoOwner,
            repoName: req.body.repoName,
            defaultProjectId: req.body.defaultProjectId,
            userId: req.user.id,
        });
        return success(res, result, 201);
    } catch (e) { next(e); }
});

router.delete('/github/disconnect', async (req, res, next) => {
    try {
        const result = await githubService.disconnect(req.user.organizationId);
        return success(res, result);
    } catch (e) { next(e); }
});

router.get('/github/status', async (req, res, next) => {
    try {
        const status = await githubService.getStatus(req.user.organizationId);
        return success(res, status);
    } catch (e) { next(e); }
});

// GitHub Webhook (NO auth - uses signature verification)
router.post('/github/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
    try {
        const signature = req.headers['x-hub-signature-256'];
        const eventType = req.headers['x-github-event'];
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        // Find org config by repo info
        const repoFullName = payload.repository?.full_name;
        if (!repoFullName) return res.status(400).json({ error: 'Missing repository info' });

        const [repoOwner, repoName] = repoFullName.split('/');
        const config = await IntegrationConfig.findOne({
            provider: 'github',
            isActive: true,
            'config.repoOwner': repoOwner,
            'config.repoName': repoName,
        });

        if (!config) return res.status(404).json({ error: 'No matching integration config' });

        // Verify signature
        if (config.config.webhookSecret && signature) {
            const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            const valid = githubService.verifyWebhookSignature(rawBody, signature, config.config.webhookSecret);
            if (!valid) return res.status(401).json({ error: 'Invalid signature' });
        }

        const results = await githubService.handleWebhook(eventType, payload, config.organizationId);
        return success(res, results);
    } catch (e) { next(e); }
});

// Slack
router.post('/slack/connect', async (req, res, next) => {
    try {
        const result = await slackService.connect({
            organizationId: req.user.organizationId,
            webhookUrl: req.body.webhookUrl,
            signingSecret: req.body.signingSecret,
            eventSubscriptions: req.body.eventSubscriptions,
            userId: req.user.id,
        });
        return success(res, result, 201);
    } catch (e) { next(e); }
});

router.delete('/slack/disconnect', async (req, res, next) => {
    try {
        const result = await slackService.disconnect(req.user.organizationId);
        return success(res, result);
    } catch (e) { next(e); }
});

router.get('/slack/status', async (req, res, next) => {
    try {
        const status = await slackService.getStatus(req.user.organizationId);
        return success(res, status);
    } catch (e) { next(e); }
});

router.post('/slack/test', async (req, res, next) => {
    try {
        const result = await slackService.sendTestMessage(req.user.organizationId);
        return success(res, result);
    } catch (e) { next(e); }
});

// Figma
router.post('/figma/connect', async (req, res, next) => {
    try {
        const result = await figmaService.connect({
            organizationId: req.user.organizationId,
            apiToken: req.body.apiToken,
            fileKey: req.body.fileKey,
            userId: req.user.id,
        });
        return success(res, result, 201);
    } catch (e) { next(e); }
});

router.delete('/figma/disconnect', async (req, res, next) => {
    try {
        const result = await figmaService.disconnect(req.user.organizationId);
        return success(res, result);
    } catch (e) { next(e); }
});

router.get('/figma/status', async (req, res, next) => {
    try {
        const status = await figmaService.getStatus(req.user.organizationId);
        return success(res, status);
    } catch (e) { next(e); }
});

// All integrations status
router.get('/status', async (req, res, next) => {
    try {
        const configs = await IntegrationConfig.find({ organizationId: req.user.organizationId })
            .populate('connectedBy', 'name email')
            .lean();

        const integrations = {};
        configs.forEach(c => {
            integrations[c.provider] = {
                connected: c.isActive,
                connectedBy: c.connectedBy,
                lastSyncAt: c.lastSyncAt,
            };
        });
        return success(res, { integrations });
    } catch (e) { next(e); }
});

module.exports = router;
