const express = require('express');
const router = express.Router();
const sprintService = require('../services/sprint.service');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

router.post('/', async (req, res, next) => {
    try {
        const sprint = await sprintService.createSprint({ ...req.body, organizationId: req.user.organizationId });
        res.status(201).json({ success: true, data: sprint });
    } catch (err) {
        next(err);
    }
});

router.get('/project/:projectId', async (req, res, next) => {
    try {
        const sprints = await sprintService.getSprints(req.params.projectId, req.user.organizationId);
        res.status(200).json({ success: true, data: sprints });
    } catch (err) {
        next(err);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const sprint = await sprintService.updateSprint(req.params.id, req.user.organizationId, req.body);
        res.status(200).json({ success: true, data: sprint });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        await sprintService.deleteSprint(req.params.id, req.user.organizationId);
        res.status(200).json({ success: true, message: 'Sprint deleted' });
    } catch (err) {
        next(err);
    }
});

router.post('/:id/complete', async (req, res, next) => {
    try {
        const sprint = await sprintService.completeSprint(req.params.id, req.user.organizationId);
        res.status(200).json({ success: true, data: sprint });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
