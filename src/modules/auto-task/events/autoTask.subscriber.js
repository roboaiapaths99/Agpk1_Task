const eventBus = require('../../../core/eventBus');
const autoTaskService = require('../services/autoTask.service');
const logger = require('../../../core/logger');
const { EVENTS } = require('../../../utils/constants');

Object.values(EVENTS).forEach((ev) => {
    eventBus.subscribe(ev, async (payload) => {
        try { await autoTaskService.evaluateAndCreate(ev, payload); }
        catch (err) { logger.error(`Auto-task subscriber error for ${ev}:`, err); }
    });
});

logger.info('Auto-Task Engine: Subscribed to all events');
