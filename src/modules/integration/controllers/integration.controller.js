const integrationService = require('../services/integration.service');

exports.handleExternalEvent = async (req, res, next) => {
    try {
        const { source, eventType, payload } = req.body;
        const result = await integrationService.handleExternalEvent(source, eventType, payload);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
