const svc = require('../services/project.service');
const { success, created } = require('../../../utils/response');
class ProjectController {
    async create(req, res, next) { try { return created(res, { project: await svc.create(req.body, req.user.id, req.user.organizationId) }); } catch (e) { next(e); } }
    async getAll(req, res, next) { try { return success(res, await svc.getAll(req.user.organizationId, req.query)); } catch (e) { next(e); } }
    async getById(req, res, next) { try { return success(res, { project: await svc.getById(req.params.id, req.user.organizationId) }); } catch (e) { next(e); } }
    async update(req, res, next) { try { return success(res, { project: await svc.update(req.params.id, req.user.organizationId, req.body) }); } catch (e) { next(e); } }
    async remove(req, res, next) { try { await svc.delete(req.params.id, req.user.organizationId); return success(res, null, 'Deleted'); } catch (e) { next(e); } }
    async addMilestone(req, res, next) { try { return created(res, { milestone: await svc.addMilestone(req.params.id, req.user.organizationId, req.body) }); } catch (e) { next(e); } }
    async getMilestones(req, res, next) { try { return success(res, await svc.getMilestones(req.params.id, req.user.organizationId)); } catch (e) { next(e); } }
    async addDependency(req, res, next) { try { return created(res, { dependency: await svc.addDependency(req.params.id, req.user.organizationId, req.body) }); } catch (e) { next(e); } }
    async getDependencies(req, res, next) { try { return success(res, { dependencies: await svc.getDependencies(req.params.id, req.user.organizationId) }); } catch (e) { next(e); } }
    async getGantt(req, res, next) { try { return success(res, await svc.getGantt(req.params.id, req.user.organizationId)); } catch (e) { next(e); } }
}
module.exports = new ProjectController();
