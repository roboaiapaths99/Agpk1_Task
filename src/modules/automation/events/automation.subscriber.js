const eventBus = require('../../../core/eventBus');
const automationService = require('../services/automation.service');
const logger = require('../../../core/logger');
const { EVENTS } = require('../../../utils/constants');

// Subscribe to ALL relevant events for automation evaluation
const automationEvents = Object.values(EVENTS);

automationEvents.forEach((eventName) => {
    eventBus.subscribe(eventName, async (payload) => {
        try {
            await automationService.evaluateRules(eventName, payload);
        } catch (err) {
            logger.error(`Automation subscriber error for ${eventName}:`, err);
        }
    });
});

logger.info(`Automation Engine: Subscribed to ${automationEvents.length} events`);
