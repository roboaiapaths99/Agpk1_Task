const taskService = require('../services/task.service');
const cacheService = require('../../../core/cache');
const { success, created } = require('../../../utils/response');

class TaskController {
    async create(req, res, next) {
        try {
            const task = await taskService.createTask(req.body, req.user.id, req.user.organizationId);
            // Invalidate cache for this organization's tasks
            await cacheService.delByPattern(`cache:${req.user.organizationId}:`);
            return created(res, { task }, 'Task created successfully');
        } catch (error) { next(error); }
    }

    async getAll(req, res, next) {
        try {
            const result = await taskService.getTasks(req.user.organizationId, req.query);
            return res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async getById(req, res, next) {
        try {
            const task = await taskService.getTaskById(req.params.id, req.user.organizationId);
            return success(res, { task });
        } catch (error) { next(error); }
    }

    async update(req, res, next) {
        try {
            const task = await taskService.updateTask(req.params.id, req.user.organizationId, req.body, req.user.id);
            await cacheService.delByPattern(`cache:${req.user.organizationId}:`);
            return success(res, { task }, 'Task updated');
        } catch (error) { next(error); }
    }

    async remove(req, res, next) {
        try {
            await taskService.deleteTask(req.params.id, req.user.organizationId, req.user.id);
            await cacheService.delByPattern(`cache:${req.user.organizationId}:`);
            return success(res, null, 'Task deleted');
        } catch (error) { next(error); }
    }

    async assign(req, res, next) {
        try {
            const task = await taskService.assignTask(req.params.id, req.user.organizationId, req.body.assigneeId, req.user.id);
            return success(res, { task }, 'Task assigned');
        } catch (error) { next(error); }
    }

    async changeStatus(req, res, next) {
        try {
            const task = await taskService.changeStatus(req.params.id, req.user.organizationId, req.body.status, req.user.id);
            return success(res, { task }, 'Status updated');
        } catch (error) { next(error); }
    }

    async bulkCreate(req, res, next) {
        try {
            const tasks = await taskService.bulkCreateTasks(req.body.tasks, req.user.id, req.user.organizationId);
            await cacheService.delByPattern(`cache:${req.user.organizationId}:`);
            return created(res, { tasks, count: tasks.length }, 'Bulk tasks created');
        } catch (error) { next(error); }
    }

    async addWatcher(req, res, next) {
        try {
            const task = await taskService.addWatcher(req.params.id, req.user.organizationId, req.body.userId);
            return success(res, { task }, 'Watcher added');
        } catch (error) { next(error); }
    }

    async removeWatcher(req, res, next) {
        try {
            const task = await taskService.removeWatcher(req.params.id, req.user.organizationId, req.body.userId);
            return success(res, { task }, 'Watcher removed');
        } catch (error) { next(error); }
    }

    async getSubTasks(req, res, next) {
        try {
            const subTasks = await taskService.getSubTasks(req.params.id, req.user.organizationId);
            return success(res, { subTasks });
        } catch (error) { next(error); }
    }

    async addDependency(req, res, next) {
        try {
            const task = await taskService.addDependency(req.params.id, req.user.organizationId, req.body);
            return success(res, { task }, 'Dependency added');
        } catch (error) { next(error); }
    }

    async removeDependency(req, res, next) {
        try {
            const task = await taskService.removeDependency(req.params.id, req.user.organizationId, req.body);
            return success(res, { task }, 'Dependency removed');
        } catch (error) { next(error); }
    }
}

module.exports = new TaskController();
