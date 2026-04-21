const aiService = require('../services/ai.service');
const forecastingService = require('../services/forecasting.service');

exports.getSprintForecast = async (req, res, next) => {
    try {
        const forecast = await forecastingService.getSprintForecast(req.params.projectId, req.user.organizationId);
        res.json({ success: true, data: forecast });
    } catch (error) {
        next(error);
    }
};

exports.suggestAssignee = async (req, res, next) => {
    try {
        const suggestion = await aiService.suggestAssignee(req.params.taskId);
        res.json({ success: true, data: suggestion });
    } catch (error) {
        next(error);
    }
};

exports.predictDelayRisk = async (req, res, next) => {
    try {
        const prediction = await aiService.predictDelayRisk(req.params.taskId);
        res.json({ success: true, data: prediction });
    } catch (error) {
        next(error);
    }
};

exports.breakdownEpic = async (req, res, next) => {
    try {
        const breakdown = await aiService.breakdownEpic(req.params.taskId);
        res.json({ success: true, data: breakdown });
    } catch (error) {
        next(error);
    }
};

exports.predictTeamHealth = async (req, res, next) => {
    try {
        const health = await aiService.predictTeamHealth(req.user.organizationId);
        res.json({ success: true, data: health });
    } catch (error) {
        next(error);
    }
};

exports.generateWorkflow = async (req, res, next) => {
    try {
        const generated = await aiService.generateWorkflow(req.body.prompt);
        res.json({ success: true, data: generated });
    } catch (error) {
        next(error);
    }
};

exports.generateContent = async (req, res, next) => {
    try {
        const generated = await aiService.generateContent(req.body.prompt, req.body.context);
        res.json({ success: true, data: generated });
    } catch (error) {
        next(error);
    }
};
