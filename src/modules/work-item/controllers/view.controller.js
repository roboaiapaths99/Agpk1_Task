const viewService = require('../services/view.service');
const { success, created } = require('../../../utils/response');

class ViewController {
    async kanban(req, res, next) {
        try {
            const data = await viewService.getKanbanView(req.user.organizationId, req.query);
            return success(res, { columns: data });
        } catch (error) { next(error); }
    }

    async calendar(req, res, next) {
        try {
            const tasks = await viewService.getCalendarView(req.user.organizationId, req.query);
            return success(res, { tasks });
        } catch (error) { next(error); }
    }

    async timeline(req, res, next) {
        try {
            const tasks = await viewService.getTimelineView(req.user.organizationId, req.query.projectId);
            return success(res, { tasks });
        } catch (error) { next(error); }
    }

    async myTasks(req, res, next) {
        try {
            const result = await viewService.getMyTasks(req.user.id, req.user.organizationId, req.query);
            return res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async overdue(req, res, next) {
        try {
            const result = await viewService.getOverdueTasks(req.user.organizationId, req.query);
            return res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async workload(req, res, next) {
        try {
            const data = await viewService.getTeamWorkload(req.user.organizationId, req.query);
            return success(res, { workload: data });
        } catch (error) { next(error); }
    }

    async saveView(req, res, next) {
        try {
            const view = await viewService.saveView(req.body, req.user.id, req.user.organizationId);
            return created(res, { view }, 'View saved');
        } catch (error) { next(error); }
    }

    async getSavedViews(req, res, next) {
        try {
            const views = await viewService.getSavedViews(req.user.id, req.user.organizationId);
            return success(res, { views });
        } catch (error) { next(error); }
    }

    async deleteSavedView(req, res, next) {
        try {
            await viewService.deleteSavedView(req.params.id, req.user.organizationId, req.user.id);
            return success(res, null, 'View deleted');
        } catch (error) { next(error); }
    }
}

module.exports = new ViewController();
