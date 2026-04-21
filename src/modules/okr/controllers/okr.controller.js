const svc = require('../services/okr.service');
const { success } = require('../../../utils/response');

class OKRController {
    // ─── Objectives ─────────────────────────────────────────
    async createObjective(req, res, next) {
        try {
            const obj = await svc.createObjective({
                ...req.body,
                organizationId: req.user.organizationId,
                owner: req.body.owner || req.user.id,
            });
            return success(res, { objective: obj }, 201);
        } catch (e) { next(e); }
    }

    async getObjectives(req, res, next) {
        try {
            const objectives = await svc.getObjectives({
                organizationId: req.user.organizationId,
                period: req.query.period,
                level: req.query.level,
                owner: req.query.owner,
            });
            return success(res, { objectives });
        } catch (e) { next(e); }
    }

    async getObjectiveById(req, res, next) {
        try {
            const objective = await svc.getObjectiveById(req.params.id, req.user.organizationId);
            return success(res, { objective });
        } catch (e) { next(e); }
    }

    async updateObjective(req, res, next) {
        try {
            const objective = await svc.updateObjective(req.params.id, req.body, req.user.organizationId);
            return success(res, { objective });
        } catch (e) { next(e); }
    }

    async deleteObjective(req, res, next) {
        try {
            const result = await svc.deleteObjective(req.params.id, req.user.organizationId);
            return success(res, result);
        } catch (e) { next(e); }
    }

    // ─── Key Results ────────────────────────────────────────
    async createKeyResult(req, res, next) {
        try {
            const kr = await svc.createKeyResult({
                ...req.body,
                organizationId: req.user.organizationId,
                owner: req.body.owner || req.user.id,
            });
            return success(res, { keyResult: kr }, 201);
        } catch (e) { next(e); }
    }

    async updateKeyResult(req, res, next) {
        try {
            const kr = await svc.updateKeyResult(req.params.id, req.body, req.user.organizationId);
            return success(res, { keyResult: kr });
        } catch (e) { next(e); }
    }

    async deleteKeyResult(req, res, next) {
        try {
            const result = await svc.deleteKeyResult(req.params.id, req.user.organizationId);
            return success(res, result);
        } catch (e) { next(e); }
    }

    async linkTasks(req, res, next) {
        try {
            const kr = await svc.linkTasksToKeyResult(req.params.id, req.body.taskIds, req.user.organizationId);
            return success(res, { keyResult: kr });
        } catch (e) { next(e); }
    }

    // ─── Dashboard ──────────────────────────────────────────
    async getDashboard(req, res, next) {
        try {
            const data = await svc.getDashboard(req.user.organizationId, req.query.period);
            return success(res, data);
        } catch (e) { next(e); }
    }
}

module.exports = new OKRController();
