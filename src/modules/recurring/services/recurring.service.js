const RecurrenceRule = require('../models/RecurrenceRule');
const Task = require('../../work-item/models/Task');
const { NotFoundError } = require('../../../core/errors');
const logger = require('../../../core/logger');
const cron = require('node-cron');
const eventBus = require('../../../core/eventBus');
const { EVENTS } = require('../../../utils/constants');

class RecurringService {
    async createRule(data, userId) {
        const nextRunAt = this._calculateNextRun(data);
        return RecurrenceRule.create({ ...data, nextRunAt, createdBy: userId });
    }

    async getRules() {
        return RecurrenceRule.find().populate('createdBy', 'name');
    }

    async updateRule(id, data) {
        if (data.frequency || data.cronExpression || data.dayOfWeek || data.dayOfMonth) {
            data.nextRunAt = this._calculateNextRun(data);
        }
        const rule = await RecurrenceRule.findByIdAndUpdate(id, data, { new: true });
        if (!rule) throw new NotFoundError('Recurrence Rule');
        return rule;
    }

    async processRecurringTasks() {
        const now = new Date();
        const rules = await RecurrenceRule.find({ isPaused: false, nextRunAt: { $lte: now } });

        for (const rule of rules) {
            try {
                const tpl = rule.taskTemplate;
                const task = await Task.create({
                    ...tpl,
                    organizationId: rule.organizationId,
                    createdBy: rule.createdBy,
                    sourceModule: 'RECURRING',
                    sourceId: rule._id,
                });

                await eventBus.publish(EVENTS.TASK_CREATED, {
                    taskId: task._id,
                    title: task.title,
                    key: task.key,
                    assignee: task.assignee,
                    priority: task.priority,
                    createdBy: rule.createdBy,
                    organizationId: rule.organizationId,
                    recurring: true
                });

                rule.lastRunAt = now;
                rule.nextRunAt = this._calculateNextRun(rule);
                await rule.save();
                logger.info(`Recurring task created: ${tpl.title} from rule: ${rule.name}`);
            } catch (err) {
                logger.error(`Failed to process recurring rule ${rule._id}:`, err);
            }
        }
    }

    _calculateNextRun(data) {
        const now = new Date();
        let next = new Date(now);
        next.setSeconds(0, 0);

        const freq = data.frequency;
        if (freq === 'daily') {
            next.setDate(next.getDate() + 1);
        } else if (freq === 'weekly') {
            const targetDay = data.dayOfWeek || 0;
            const currentDay = next.getDay();
            let diff = targetDay - currentDay;
            if (diff <= 0) diff += 7;
            next.setDate(next.getDate() + diff);
        } else if (freq === 'monthly') {
            const targetDay = data.dayOfMonth || 1;
            next.setMonth(next.getMonth() + 1);
            next.setDate(targetDay);
        } else if (freq === 'cron' && data.cronExpression) {
            // In a real app, use a cron library to find the next occurrence
            // Placeholder: next hour
            next.setHours(next.getHours() + 1);
        } else {
            next.setDate(next.getDate() + 1);
        }
        return next;
    }
}

module.exports = new RecurringService();
