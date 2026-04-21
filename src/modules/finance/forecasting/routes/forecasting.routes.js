const express = require('express');
const router = express.Router();
const forecastingController = require('../controllers/forecasting.controller');
const { authenticate } = require('../../../../middlewares/auth');

router.use(authenticate);

router.get('/', forecastingController.getRevenueForecast);

module.exports = router;
