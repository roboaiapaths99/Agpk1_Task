const healthService = require('../services/health.service');

exports.getTeamScore = async (req, res, next) => {
    try {
        const health = await healthService.getTeamScore();
        res.json({ success: true, data: health });
    } catch (error) {
        next(error);
    }
};
