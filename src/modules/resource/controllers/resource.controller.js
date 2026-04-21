const svc = require('../services/resource.service');
const { success } = require('../../../utils/response');

class ResourceController {
    async getTeamCapacity(req, res, next) {
        try {
            const data = await svc.getTeamCapacity(req.user.organizationId, req.query.weekStart);
            return success(res, { capacities: data });
        } catch (e) { next(e); }
    }

    async setCapacity(req, res, next) {
        try {
            const cap = await svc.setCapacity(req.params.userId, req.query.weekStart, req.body, req.user.organizationId);
            return success(res, { capacity: cap });
        } catch (e) { next(e); }
    }

    async addTimeOff(req, res, next) {
        try {
            const results = await svc.addTimeOff(req.params.userId, req.body.dates, req.user.organizationId);
            return success(res, { results });
        } catch (e) { next(e); }
    }

    async suggestReassignment(req, res, next) {
        try {
            const suggestions = await svc.suggestReassignment(req.params.taskId, req.user.organizationId);
            return success(res, { suggestions });
        } catch (e) { next(e); }
    }
}

module.exports = new ResourceController();
