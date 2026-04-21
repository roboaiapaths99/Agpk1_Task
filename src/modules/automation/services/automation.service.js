const AutomationRule = require('../models/AutomationRule');
const Task = require('../../work-item/models/Task');
const eventBus = require('../../../core/eventBus');
const logger = require('../../../core/logger');
const { NotFoundError } = require('../../../core/errors');
const { EVENTS } = require('../../../utils/constants');


class AutomationService {
    async createRule(data, userId, organizationId) {
        return AutomationRule.create({ ...data, createdBy: userId, organizationId });
    }

    async getRules(organizationId, filters = {}) {
        const query = { organizationId };
        if (filters.isActive !== undefined) query.isActive = filters.isActive;
        if (filters.triggerEvent) query.triggerEvent = filters.triggerEvent;
        return AutomationRule.find(query).populate('createdBy', 'name');
    }

    async updateRule(id, organizationId, data) {
        const rule = await AutomationRule.findOneAndUpdate({ _id: id, organizationId }, data, { new: true, runValidators: true });
        if (!rule) throw new NotFoundError('Automation Rule');
        return rule;
    }

    async deleteRule(id, organizationId) {
        const rule = await AutomationRule.findOneAndDelete({ _id: id, organizationId });
        if (!rule) throw new NotFoundError('Automation Rule');
        return rule;
    }

    async evaluateRules(eventName, payload) {
        const { organizationId } = payload;
        if (!organizationId) {
            logger.warn(`Automation evaluation skipped: No organizationId in payload for event ${eventName}`);
            return;
        }

        const rules = await AutomationRule.find({ triggerEvent: eventName, isActive: true, organizationId });
        for (const rule of rules) {
            const match = this._checkConditions(rule.conditions, payload);
            if (match) {
                logger.info(`Automation rule matched: ${rule.name} for event ${eventName} (Org: ${organizationId})`);
                for (const action of rule.actions) {
                    await this._executeAction(action, payload, organizationId);
                }
                rule.executionCount += 1;
                rule.lastExecuted = new Date();
                await rule.save();
            }
        }
    }

    _checkConditions(conditions, payload) {
        return conditions.every((cond) => {
            const value = this._getNestedValue(payload, cond.field);
            switch (cond.operator) {
                case 'equals': return String(value) === String(cond.value);
                case 'not_equals': return String(value) !== String(cond.value);
                case 'contains': return String(value).includes(String(cond.value));
                case 'gt': return value > cond.value;
                case 'lt': return value < cond.value;
                case 'gte': return value >= cond.value;
                case 'lte': return value <= cond.value;
                case 'in': return Array.isArray(cond.value) && cond.value.map(v => String(v)).includes(String(value));
                case 'not_in': return Array.isArray(cond.value) && !cond.value.map(v => String(v)).includes(String(value));
                default: return false;
            }
        });
    }

    async _executeAction(action, payload, organizationId) {
        try {
            const baseQuery = { _id: payload.taskId, organizationId };
            const updateOptions = { new: true };

            switch (action.type) {
                case 'create_task':
                    await Task.create({
                        ...action.config,
                        organizationId,
                        createdBy: payload.createdBy || payload.triggeredBy
                    });
                    break;
                case 'update_task':
                    if (payload.taskId) {
                        const updated = await Task.findOneAndUpdate(baseQuery, action.config, updateOptions);
                        if (updated) await eventBus.publish(EVENTS.TASK_UPDATED, { taskId: updated._id, organizationId, updatedBy: 'automation' });
                    }
                    break;
                case 'assign_task':
                    if (payload.taskId) {
                        const updated = await Task.findOneAndUpdate(baseQuery, { assignee: action.config.assigneeId }, updateOptions);
                        if (updated) await eventBus.publish(EVENTS.TASK_ASSIGNED, { taskId: updated._id, assigneeId: action.config.assigneeId, organizationId, assignedBy: 'automation' });
                    }
                    break;
                case 'change_status':
                    if (payload.taskId) {
                        const updated = await Task.findOneAndUpdate(baseQuery, { status: action.config.status }, updateOptions);
                        if (updated) await eventBus.publish(EVENTS.TASK_STATUS_CHANGED, { taskId: updated._id, status: action.config.status, organizationId, changedBy: 'automation' });
                    }
                    break;
                case 'notify':
                    await eventBus.publish('AUTOMATION_NOTIFICATION', {
                        ...action.config,
                        organizationId,
                        sourcePayload: payload
                    });
                    break;
                case 'escalate':
                    if (payload.taskId) {
                        const updated = await Task.findOneAndUpdate(baseQuery, { status: 'escalated', priority: 'critical' }, updateOptions);
                        if (updated) await eventBus.publish(EVENTS.TASK_STATUS_CHANGED, { taskId: updated._id, status: 'escalated', organizationId, changedBy: 'automation' });
                    }
                    break;
                case 'add_tag':
                    if (payload.taskId) {
                        const updated = await Task.findOneAndUpdate(baseQuery, { $addToSet: { tags: action.config.tag } }, updateOptions);
                        if (updated) await eventBus.publish(EVENTS.TASK_UPDATED, { taskId: updated._id, organizationId, updatedBy: 'automation' });
                    }
                    break;

                default:
                    logger.warn(`Unknown automation action: ${action.type}`);
            }
        } catch (err) {
            logger.error(`Automation action failed: ${action.type}`, err);
        }
    }

    _getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
}

module.exports = new AutomationService();
