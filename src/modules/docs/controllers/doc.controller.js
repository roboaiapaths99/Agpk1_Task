const svc = require('../services/doc.service');
const { success } = require('../../../utils/response');

class DocController {
    async create(req, res, next) {
        try {
            const doc = await svc.create({
                ...req.body,
                organizationId: req.user.organizationId,
                userId: req.user.id,
            });
            return success(res, { document: doc }, 201);
        } catch (e) {
            next(e);
        }
    }

    async getAll(req, res, next) {
        try {
            const docs = await svc.getAll({
                organizationId: req.user.organizationId,
                projectId: req.query.projectId,
                parentDocId: req.query.parentDocId,
                search: req.query.search,
                isTemplate: req.query.isTemplate,
            });
            return success(res, { documents: docs });
        } catch (e) {
            next(e);
        }
    }

    async getById(req, res, next) {
        try {
            const doc = await svc.getById(req.params.id, req.user.organizationId);
            return success(res, { document: doc });
        } catch (e) {
            next(e);
        }
    }

    async update(req, res, next) {
        try {
            const doc = await svc.update(req.params.id, req.body, req.user.id, req.user.organizationId);
            return success(res, { document: doc });
        } catch (e) {
            next(e);
        }
    }

    async archive(req, res, next) {
        try {
            const result = await svc.archive(req.params.id, req.user.organizationId);
            return success(res, result);
        } catch (e) {
            next(e);
        }
    }

    async linkTask(req, res, next) {
        try {
            const doc = await svc.linkTask(req.params.id, req.body.taskId, req.user.organizationId);
            return success(res, { document: doc });
        } catch (e) {
            next(e);
        }
    }

    async unlinkTask(req, res, next) {
        try {
            const doc = await svc.unlinkTask(req.params.id, req.body.taskId, req.user.organizationId);
            return success(res, { document: doc });
        } catch (e) {
            next(e);
        }
    }

    async getTemplates(req, res, next) {
        try {
            const templates = await svc.getTemplates(req.user.organizationId);
            return success(res, { templates });
        } catch (e) {
            next(e);
        }
    }

    async getDocTree(req, res, next) {
        try {
            const tree = await svc.getDocTree(req.user.organizationId, req.query.projectId);
            return success(res, { tree });
        } catch (e) {
            next(e);
        }
    }

    async convertToTemplate(req, res, next) {
        try {
            const doc = await svc.convertToTemplate(req.params.id, req.user.organizationId);
            return success(res, { document: doc });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new DocController();
