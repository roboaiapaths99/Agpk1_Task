const { Workflow } = require('../models/Workflow');
const TransitionLog = require('../models/TransitionLog');
const Task = require('../../work-item/models/Task');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../../core/errors');
const eventBus = require('../../../core/eventBus');
const { EVENTS } = require('../../../utils/constants');

class WorkflowService {
    async createWorkflow(data, userId, organizationId) {
        if (data.defaultState && typeof data.defaultState === 'object') {
            data.defaultState = data.defaultState.name;
        }

        if (!data.defaultState && data.states && data.states.length > 0) {
            data.defaultState = typeof data.states[0] === 'object' ? data.states[0].name : data.states[0];
        }
        return Workflow.create({ ...data, createdBy: userId, organizationId });
    }


    async getWorkflows(organizationId) {
        return Workflow.find({ organizationId, isActive: true }).populate('createdBy', 'name');
    }

    async getWorkflowById(id, organizationId) {
        const wf = await Workflow.findOne({ _id: id, organizationId });
        if (!wf) throw new NotFoundError('Workflow');
        return wf;
    }

    async updateWorkflow(id, organizationId, data) {
        const wf = await Workflow.findOneAndUpdate({ _id: id, organizationId }, data, { new: true, runValidators: true });
        if (!wf) throw new NotFoundError('Workflow');
        return wf;
    }

    async moveTaskState(taskId, toState, userId, organizationId, reason = '') {
        const task = await Task.findOne({ _id: taskId, organizationId });
        if (!task) throw new NotFoundError('Task');

        const workflow = await Workflow.findOne({ _id: task.workflowId, organizationId });
        if (!workflow) throw new NotFoundError('Workflow');

        const fromState = task.status;
        const transition = workflow.transitions.find((t) => t.from === fromState && t.to === toState);
        if (!transition) throw new ValidationError(`Invalid transition from '${fromState}' to '${toState}'`);

        // Role check
        if (transition.allowedRoles && transition.allowedRoles.length > 0) {
            const User = require('../../auth/models/User');
            const user = await User.findOne({ _id: userId, organizationId });
            if (!user || !transition.allowedRoles.includes(user.role)) {
                throw new ForbiddenError('Your role cannot perform this transition');
            }
        }

        // Condition evaluation (The "Trusty System" Guardrails)
        if (transition.conditions && transition.conditions.length > 0) {
            for (const condition of transition.conditions) {
                if (condition.field === 'checklist_completed' && condition.value === true) {
                    const Checklist = require('../../work-item/models/Checklist');
                    const checklists = await Checklist.find({ taskId, organizationId });

                    if (checklists.length > 0) {
                        const allDone = checklists.every(cl =>
                            cl.items.every(item => item.completed)
                        );
                        if (!allDone) {
                            throw new ValidationError('All checklist items must be completed before moving to this state.');
                        }
                    }
                }

                // Add more conditions here as needed (e.g., worklog duration, required fields)
            }
        }

        task.status = toState;
        if (toState === 'completed') task.completedAt = new Date();
        await task.save();

        await TransitionLog.create({ taskId, workflowId: workflow._id, organizationId, fromState, toState, triggeredBy: userId, reason });

        // Specific workflow event
        await eventBus.publish(EVENTS.TASK_STATE_CHANGED, {
            organizationId, taskId, fromState, toState, triggeredBy: userId, workflowId: workflow._id,
        });

        // Generic task navigation events for automation hub
        await eventBus.publish(EVENTS.TASK_STATUS_CHANGED, {
            organizationId, taskId, status: toState, fromStatus: fromState, userId
        });

        await eventBus.publish(EVENTS.TASK_UPDATED, {
            organizationId, taskId, userId, updates: { status: toState }
        });

        return task;

    }

    async getTransitionHistory(taskId, organizationId) {
        return TransitionLog.find({ taskId, organizationId }).populate('triggeredBy', 'name email').sort('-createdAt');
    }
}

module.exports = new WorkflowService();
