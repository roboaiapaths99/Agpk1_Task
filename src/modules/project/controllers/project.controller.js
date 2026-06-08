const svc = require('../services/project.service');
const { success, created } = require('../../../utils/response');

class ProjectController {
    async create(req, res, next) {
        try {
            return created(res, { project: await svc.create(req.body, req.user.id, req.user.organizationId) });
        } catch (e) {
            next(e);
        }
    }

    async getAll(req, res, next) {
        try {
            return success(res, await svc.getAll(req.user.organizationId, req.user.id, req.user.role, req.query));
        } catch (e) {
            next(e);
        }
    }

    async getById(req, res, next) {
        try {
            return success(res, { project: await svc.getById(req.params.id, req.user.organizationId, req.user.id, req.user.role) });
        } catch (e) {
            next(e);
        }
    }

    async update(req, res, next) {
        try {
            return success(res, { project: await svc.update(req.params.id, req.user.organizationId, req.body) });
        } catch (e) {
            next(e);
        }
    }

    async remove(req, res, next) {
        try {
            await svc.delete(req.params.id, req.user.organizationId);
            return success(res, null, 'Deleted');
        } catch (e) {
            next(e);
        }
    }

    async addMilestone(req, res, next) {
        try {
            return created(res, { milestone: await svc.addMilestone(req.params.id, req.user.organizationId, req.body) });
        } catch (e) {
            next(e);
        }
    }

    async getMilestones(req, res, next) {
        try {
            return success(res, await svc.getMilestones(req.params.id, req.user.organizationId));
        } catch (e) {
            next(e);
        }
    }

    async updateMilestone(req, res, next) {
        try {
            return success(res, { milestone: await svc.updateMilestone(req.params.milestoneId, req.user.organizationId, req.body) });
        } catch (e) {
            next(e);
        }
    }

    async addDependency(req, res, next) {
        try {
            return created(res, { dependency: await svc.addDependency(req.params.id, req.user.organizationId, req.body) });
        } catch (e) {
            next(e);
        }
    }

    async getDependencies(req, res, next) {
        try {
            return success(res, { dependencies: await svc.getDependencies(req.params.id, req.user.organizationId) });
        } catch (e) {
            next(e);
        }
    }

    async removeDependency(req, res, next) {
        try {
            await svc.removeDependency(req.params.depId, req.user.organizationId);
            return success(res, null, 'Dependency removed successfully');
        } catch (e) {
            next(e);
        }
    }

    async getGantt(req, res, next) {
        try {
            return success(res, await svc.getGantt(req.params.id, req.user.organizationId));
        } catch (e) {
            next(e);
        }
    }

    async addMember(req, res, next) {
        try {
            const { userId } = req.body;
            const project = await svc.addMember(req.params.id, userId, req.user.organizationId);
            return success(res, { project }, 'Member added successfully');
        } catch (e) {
            next(e);
        }
    }

    async removeMember(req, res, next) {
        try {
            const project = await svc.removeMember(req.params.id, req.params.userId, req.user.organizationId);
            return success(res, { project }, 'Member removed successfully');
        } catch (e) {
            next(e);
        }
    }

    async getMembers(req, res, next) {
        try {
            const members = await svc.getMembers(req.params.id, req.user.organizationId);
            return success(res, { members });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new ProjectController();
