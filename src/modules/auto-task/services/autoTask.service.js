const TaskCreationRule = require('../models/TaskCreationRule');
const Task = require('../../work-item/models/Task');
const logger = require('../../../core/logger');
const { NotFoundError } = require('../../../core/errors');

class AutoTaskService {
    async createRule(data, userId) { return TaskCreationRule.create({ ...data, createdBy: userId }); }
    async getRules() { return TaskCreationRule.find({ isActive: true }).populate('createdBy', 'name'); }
    async updateRule(id, data) { const r = await TaskCreationRule.findByIdAndUpdate(id, data, { new: true }); if (!r) throw new NotFoundError('Rule'); return r; }
    async deleteRule(id) { const r = await TaskCreationRule.findByIdAndDelete(id); if (!r) throw new NotFoundError('Rule'); return r; }

    async evaluateAndCreate(eventName, payload) {
        const rules = await TaskCreationRule.find({ triggerEvent: eventName, isActive: true });
        const created = [];
        for (const rule of rules) {
            if (this._check(rule.conditions, payload)) {
                const tpl = rule.taskTemplate;
                const dueDate = tpl.dueDateOffset ? new Date(Date.now() + tpl.dueDateOffset * 86400000) : null;
                const task = await Task.create({
                    title: this._interpolate(tpl.title, payload),
                    description: this._interpolate(tpl.description, payload),
                    priority: tpl.priority,
                    assignee: tpl.assignee,
                    tags: tpl.tags,
                    dueDate,
                    sourceModule: tpl.sourceModule,
                    sourceId: payload.taskId || payload.sourceId || null,
                    createdBy: payload.createdBy || payload.userId || rule.createdBy,
                });
                created.push(task);
                logger.info(`Auto-task created: ${task.title} from rule: ${rule.name}`);
            }
        }
        return created;
    }

    _check(conditions, payload) {
        return conditions.every((c) => {
            const v = c.field.split('.').reduce((o, k) => o && o[k], payload);
            switch (c.operator) {
                case 'equals': return v === c.value;
                case 'not_equals': return v !== c.value;
                case 'contains': return String(v).includes(String(c.value));
                case 'gt': return v > c.value;
                case 'lt': return v < c.value;
                case 'in': return Array.isArray(c.value) && c.value.includes(v);
                default: return false;
            }
        });
    }

    _interpolate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || key);
    }
}

module.exports = new AutoTaskService();
