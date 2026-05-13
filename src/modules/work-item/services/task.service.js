const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Checklist = require('../models/Checklist');
const Attachment = require('../models/Attachment');
const { NotFoundError } = require('../../../core/errors');
const eventBus = require('../../../core/eventBus');
const { EVENTS } = require('../../../utils/constants');
const { paginate, paginationMeta } = require('../../../utils/pagination');
const { withTransaction } = require('../../../utils/transaction');
const slaService = require('./sla.service');


class TaskService {
    // ======================== TASK CRUD ========================

    async createTask(data, userId, organizationId) {
        // Generate Task Key if project is provided
        if (data.project) {
            const Project = require('../../project/models/Project').Project;
            const project = await Project.findOne({ _id: data.project, organizationId });
            if (project) {
                // Assign default workflow if not provided
                if (!data.workflowId && project.defaultWorkflowId) {
                    data.workflowId = project.defaultWorkflowId;
                }
                const prefix = project.keyPrefix || 'TASK';
                // Find the latest task for this organization with the same prefix to get the next sequence number
                const lastTask = await Task.findOne({ organizationId, key: new RegExp(`^${prefix}-`) })
                    .sort({ createdAt: -1 })
                    .select('key');
                
                let nextNumber = 1;
                if (lastTask && lastTask.key) {
                    const lastKeyParts = lastTask.key.split('-');
                    const lastNumber = parseInt(lastKeyParts[lastKeyParts.length - 1], 10);
                    if (!isNaN(lastNumber)) {
                        nextNumber = lastNumber + 1;
                    }
                }
                data.key = `${prefix}-${nextNumber}`;
            }
        }

        // Inheritance for sub-tasks
        if (data.parent) {
            const parentTask = await Task.findOne({ _id: data.parent, organizationId });
            if (parentTask) {
                data.project = data.project || parentTask.project;
                data.sprint = data.sprint || parentTask.sprint;
                data.issueType = data.issueType || 'task'; // default child to task
            }
        }

        const task = await Task.create({ ...data, createdBy: userId, organizationId });
        const populated = await Task.findOne({ _id: task._id, organizationId })
            .populate('assignee', 'name email')
            .populate('createdBy', 'name email')
            .populate('project', 'name keyPrefix');

        // Apply SLA Policy
        await slaService.applySLA(task);


        await eventBus.publish(EVENTS.TASK_CREATED, {
            taskId: task._id,
            title: task.title,
            key: task.key,
            assignee: task.assignee,
            priority: task.priority,
            createdBy: userId,
            organizationId,
        });

        return populated;
    }

    async getTasks(organizationId, queryParams = {}) {
        const { skip, limit, page, sort } = paginate(queryParams);
        const filter = { ...this._buildFilter(queryParams), organizationId };

        const [tasks, total] = await Promise.all([
            Task.find(filter)
                .populate('assignee', 'name email')
                .populate('createdBy', 'name email')
                .populate('project', 'name')
                .populate('sprint', 'name status')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Task.countDocuments(filter),
        ]);

        return { tasks, pagination: paginationMeta(total, page, limit) };
    }

    async getTaskById(taskId, organizationId) {
        const task = await Task.findOne({ _id: taskId, organizationId })
            .populate('assignee', 'name email')
            .populate('createdBy', 'name email')
            .populate('watchers', 'name email')
            .populate('project', 'name')
            .populate({
                path: 'children',
                populate: { path: 'assignee', select: 'name email' }
            })
            .populate('dependencies.task', 'title key status');
        if (!task) throw new NotFoundError('Task');
        return task;
    }

    async getSubTasks(parentId, organizationId) {
        return Task.find({ parent: parentId, organizationId })
            .populate('assignee', 'name email')
            .populate('createdBy', 'name email')
            .sort('createdAt');
    }

    async updateTask(taskId, organizationId, data, userId) {
        // Enforce workflow rules if status is being updated
        if (data.status) {
            const newStatus = data.status;
            const updateData = { ...data };
            delete updateData.status;

            // First apply the status change via dedicated method (checks workflow)
            await this.changeStatus(taskId, organizationId, newStatus, userId);

            // Then apply the rest of the updates
            if (Object.keys(updateData).length === 0) {
                return this.getTaskById(taskId, organizationId);
            }
            data = updateData;
        }

        const task = await Task.findOneAndUpdate(
            { _id: taskId, organizationId },
            data,
            { new: true, runValidators: true }
        ).populate('assignee', 'name email');
        if (!task) throw new NotFoundError('Task');

        await eventBus.publish(EVENTS.TASK_UPDATED, {
            taskId: task._id,
            changes: data,
            updatedBy: userId,
            organizationId,
        });

        // Re-apply SLA if priority changed
        if (data.priority) {
            await slaService.applySLA(task);
        }

        return task;
    }


    async deleteTask(taskId, organizationId, userId) {
        const task = await Task.findOneAndDelete({ _id: taskId, organizationId });
        if (!task) throw new NotFoundError('Task');

        // Clean up related data
        await Promise.all([
            Comment.deleteMany({ taskId, organizationId }),
            Checklist.deleteMany({ taskId, organizationId }),
            Attachment.deleteMany({ taskId, organizationId }),
        ]);

        await eventBus.publish(EVENTS.TASK_DELETED, { taskId, deletedBy: userId, organizationId });
        return task;
    }

    async assignTask(taskId, organizationId, assigneeId, userId) {
        const task = await Task.findOneAndUpdate(
            { _id: taskId, organizationId },
            { assignee: assigneeId },
            { new: true, runValidators: true }
        ).populate('assignee', 'name email');
        if (!task) throw new NotFoundError('Task');

        await eventBus.publish(EVENTS.TASK_ASSIGNED, {
            taskId: task._id,
            title: task.title,
            assigneeId,
            assignedBy: userId,
            organizationId,
        });

        return task;
    }

    async changeStatus(taskId, organizationId, status, userId, reason = '') {
        const task = await Task.findOne({ _id: taskId, organizationId });
        if (!task) throw new NotFoundError('Task');

        // If workflow is assigned, try to use WorkflowService to enforce transition
        if (task.workflowId) {
            try {
                const workflowService = require('../../workflow/services/workflow.service');
                return await workflowService.moveTaskState(taskId, status, userId, organizationId, reason);
            } catch (err) {
                // If the workflow blocks the transition (invalid transition), fall back to direct update
                // This allows kanban drag-and-drop to work freely
                console.warn(`Workflow transition skipped: ${err.message}. Proceeding with direct status update.`);
            }
        }

        // Fallback for tasks without workflows or when workflow transition is not defined
        const update = { status };
        if (status === 'completed') update.completedAt = new Date();

        const updatedTask = await Task.findOneAndUpdate(
            { _id: taskId, organizationId },
            update,
            { new: true, runValidators: true }
        );

        await eventBus.publish(EVENTS.TASK_STATUS_CHANGED, {
            taskId: updatedTask._id,
            organizationId,
            status,
            userId
        });

        return updatedTask;
    }

    async bulkCreateTasks(tasksArray, userId, organizationId) {
        return await withTransaction(async (session) => {
            const tasks = tasksArray.map((t) => ({ ...t, createdBy: userId, organizationId }));
            const created = await Task.insertMany(tasks, { ordered: true, session });

            for (const task of created) {
                await eventBus.publish(EVENTS.TASK_CREATED, {
                    taskId: task._id,
                    title: task.title,
                    assignee: task.assignee,
                    priority: task.priority,
                    createdBy: userId,
                    organizationId,
                    bulk: true,
                });
            }

            return created;
        });
    }

    async addWatcher(taskId, organizationId, watcherId) {
        const task = await Task.findOneAndUpdate(
            { _id: taskId, organizationId },
            { $addToSet: { watchers: watcherId } },
            { new: true }
        );
        if (!task) throw new NotFoundError('Task');
        return task;
    }

    async removeWatcher(taskId, organizationId, watcherId) {
        const task = await Task.findOneAndUpdate(
            { _id: taskId, organizationId },
            { $pull: { watchers: watcherId } },
            { new: true }
        );
        if (!task) throw new NotFoundError('Task');
        return task;
    }

    // ======================== DEPENDENCIES = require Jira Links ========================

    async addDependency(taskId, organizationId, dependencyData) {
        const { targetTaskId, type } = dependencyData;

        // 1. Check if target task exists
        const targetTask = await Task.findOne({ _id: targetTaskId, organizationId });
        if (!targetTask) throw new NotFoundError('Target Task');

        // 2. Add dependency to source task
        const task = await Task.findOneAndUpdate(
            { _id: taskId, organizationId },
            { $addToSet: { dependencies: { type, task: targetTaskId } } },
            { new: true }
        ).populate('dependencies.task', 'title key status');

        if (!task) throw new NotFoundError('Task');

        // 3. Bi-lateral linking
        const inverseType = type === 'blocks' ? 'is_blocked_by' : (type === 'is_blocked_by' ? 'blocks' : 'relates_to');
        await Task.findOneAndUpdate(
            { _id: targetTaskId, organizationId },
            { $addToSet: { dependencies: { type: inverseType, task: taskId } } }
        );

        return task;
    }

    async removeDependency(taskId, organizationId, dependencyData) {
        const { targetTaskId, type } = dependencyData;

        const task = await Task.findOneAndUpdate(
            { _id: taskId, organizationId },
            { $pull: { dependencies: { task: targetTaskId, type } } },
            { new: true }
        );

        if (!task) throw new NotFoundError('Task');

        // Remove inverse
        const inverseType = type === 'blocks' ? 'is_blocked_by' : (type === 'is_blocked_by' ? 'blocks' : 'relates_to');
        await Task.findOneAndUpdate(
            { _id: targetTaskId, organizationId },
            { $pull: { dependencies: { task: taskId, type: inverseType } } }
        );

        return task;
    }

    // ======================== COMMENTS ========================

    async addComment(taskId, organizationId, data, userId) {
        const task = await Task.findOne({ _id: taskId, organizationId });
        if (!task) throw new NotFoundError('Task');

        const comment = await Comment.create({
            taskId,
            organizationId,
            author: userId,
            content: data.content,
            mentions: data.mentions || [],
            parentComment: data.parentComment || null,
        });

        const populated = await Comment.findOne({ _id: comment._id, organizationId }).populate('author', 'name email');

        await eventBus.publish(EVENTS.COMMENT_ADDED, {
            taskId,
            organizationId,
            commentId: comment._id,
            author: userId,
            content: data.content,
            mentions: data.mentions || [],
            taskTitle: task.title,
            taskAssignee: task.assignee,
        });

        return populated;
    }

    async getComments(taskId, organizationId, queryParams = {}) {
        const { skip, limit, page } = paginate(queryParams);
        const [comments, total] = await Promise.all([
            Comment.find({ taskId, organizationId })
                .populate('author', 'name email')
                .populate('parentComment')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments({ taskId, organizationId }),
        ]);
        return { comments, pagination: paginationMeta(total, page, limit) };
    }

    async updateComment(commentId, organizationId, content, userId) {
        const comment = await Comment.findOneAndUpdate(
            { _id: commentId, organizationId, author: userId },
            { content, isEdited: true, editedAt: new Date() },
            { new: true }
        ).populate('author', 'name email');
        if (!comment) throw new NotFoundError('Comment');
        return comment;
    }

    async deleteComment(commentId, organizationId, userId) {
        const comment = await Comment.findOneAndDelete({ _id: commentId, organizationId, author: userId });
        if (!comment) throw new NotFoundError('Comment');
        return comment;
    }

    // ======================== CHECKLIST ========================

    async addChecklist(taskId, organizationId, data) {
        const task = await Task.findOne({ _id: taskId, organizationId });
        if (!task) throw new NotFoundError('Task');

        const checklist = await Checklist.create({
            taskId,
            organizationId,
            title: data.title || 'Checklist',
            items: data.items || [],
        });
        return checklist;
    }

    async addItemToChecklist(checklistId, organizationId, itemData) {
        const checklist = await Checklist.findOne({ _id: checklistId, organizationId });
        if (!checklist) throw new NotFoundError('Checklist');

        checklist.items.push(itemData);
        await checklist.save();
        return checklist;
    }


    async updateChecklistItem(checklistId, organizationId, itemId, data) {
        const checklist = await Checklist.findOne({ _id: checklistId, organizationId });
        if (!checklist) throw new NotFoundError('Checklist');

        const item = checklist.items.id(itemId);
        if (!item) throw new NotFoundError('Checklist item');

        if (data.title !== undefined) item.title = data.title;
        if (data.completed !== undefined) item.completed = data.completed;
        if (data.assignee !== undefined) item.assignee = data.assignee;

        await checklist.save();
        return checklist;
    }

    async deleteChecklist(checklistId, organizationId) {
        const checklist = await Checklist.findOneAndDelete({ _id: checklistId, organizationId });
        if (!checklist) throw new NotFoundError('Checklist');
        return checklist;
    }

    async getChecklists(taskId, organizationId) {
        return Checklist.find({ taskId, organizationId });
    }

    // ======================== ATTACHMENTS ========================

    async addAttachment(taskId, organizationId, file, userId) {
        const task = await Task.findOne({ _id: taskId, organizationId });
        if (!task) throw new NotFoundError('Task');

        const attachment = await Attachment.create({
            taskId,
            organizationId,
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            uploadedBy: userId,
        });
        return attachment;
    }

    async getAttachments(taskId, organizationId) {
        return Attachment.find({ taskId, organizationId }).populate('uploadedBy', 'name email');
    }

    async deleteAttachment(attachmentId, organizationId) {
        const attachment = await Attachment.findOneAndDelete({ _id: attachmentId, organizationId });
        if (!attachment) throw new NotFoundError('Attachment');
        return attachment;
    }

    // ======================== FILTERS ========================

    _buildFilter(params) {
        const filter = { isArchived: false };
        if (params.status) filter.status = params.status;
        if (params.priority) filter.priority = params.priority;
        if (params.assignee) filter.assignee = params.assignee;
        if (params.project) filter.project = params.project;
        if (params.sprint) filter.sprint = params.sprint;
        if (params.createdBy) filter.createdBy = params.createdBy;
        if (params.sourceModule) filter.sourceModule = params.sourceModule;
        if (params.tags) filter.tags = { $in: Array.isArray(params.tags) ? params.tags : [params.tags] };
        if (params.search) filter.$text = { $search: params.search };
        if (params.dueBefore) filter.dueDate = { ...filter.dueDate, $lte: new Date(params.dueBefore) };
        if (params.dueAfter) filter.dueDate = { ...filter.dueDate, $gte: new Date(params.dueAfter) };
        return filter;
    }
}

module.exports = new TaskService();
