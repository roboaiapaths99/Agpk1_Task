const forecastingService = require('../services/forecasting.service');
const logger = require('../../../../core/logger');

exports.getRevenueForecast = async (req, res, next) => {
    try {
        const organizationId = req.user.organizationId;
        const predictions = await forecastingService.generateRevenueForecast(organizationId);
        
        res.status(200).json({
            success: true,
            data: predictions
        });
    } catch (error) {
        logger.error(`Forecast Controller Error: ${error.message}`);
        next(error);
    }
};
