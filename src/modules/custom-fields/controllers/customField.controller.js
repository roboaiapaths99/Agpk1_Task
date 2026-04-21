const svc = require('../services/customField.service');
const { success } = require('../../../utils/response');

class CustomFieldController {
    async create(req, res, next) {
        try {
            const field = await svc.create({
                ...req.body,
                organizationId: req.user.organizationId,
                createdBy: req.user.id,
            });
            return success(res, { field }, 201);
        } catch (e) { next(e); }
    }

    async getAll(req, res, next) {
        try {
            const fields = await svc.getAll({
                organizationId: req.user.organizationId,
                projectId: req.query.projectId,
                appliesTo: req.query.appliesTo,
            });
            return success(res, { fields });
        } catch (e) { next(e); }
    }

    async getById(req, res, next) {
        try {
            const field = await svc.getById(req.params.id, req.user.organizationId);
            return success(res, { field });
        } catch (e) { next(e); }
    }

    async update(req, res, next) {
        try {
            const field = await svc.update(req.params.id, req.body, req.user.organizationId);
            return success(res, { field });
        } catch (e) { next(e); }
    }

    async remove(req, res, next) {
        try {
            const result = await svc.remove(req.params.id, req.user.organizationId);
            return success(res, result);
        } catch (e) { next(e); }
    }

    async reorder(req, res, next) {
        try {
            const result = await svc.reorder(req.body.fieldIds, req.user.organizationId);
            return success(res, result);
        } catch (e) { next(e); }
    }
}

module.exports = new CustomFieldController();
