const standupService = require('../services/standup.service');

exports.submitStandup = async (req, res, next) => {
    try {
        const standup = await standupService.submit(req.user.id, req.user.organizationId, req.body);
        res.json({ success: true, data: standup });
    } catch (error) {
        next(error);
    }
};

exports.getTeamStandups = async (req, res, next) => {
    try {
        const standups = await standupService.getTeamStandups(req.user.organizationId, req.query.date);
        res.json({ success: true, data: standups });
    } catch (error) {
        next(error);
    }
};

exports.getMyStandups = async (req, res, next) => {
    try {
        const standups = await standupService.getMyStandups(req.user.id, req.user.organizationId);
        res.json({ success: true, data: standups });
    } catch (error) {
        next(error);
    }
};
