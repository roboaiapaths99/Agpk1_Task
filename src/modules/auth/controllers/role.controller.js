const Role = require('../models/Role');
const { success, created } = require('../../../utils/response');
const { NotFoundError, AppError } = require('../../../core/errors');

class RoleController {
    async create(req, res, next) {
        try {
            const role = await Role.create({
                ...req.body,
                organizationId: req.user.organizationId,
                isSystem: false
            });
            return created(res, role, 'Role created successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const roles = await Role.find({ organizationId: req.user.organizationId });
            return success(res, roles);
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const role = await Role.findOne({
                _id: req.params.id,
                organizationId: req.user.organizationId
            });
            if (!role) throw new NotFoundError('Role');
            return success(res, role);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const role = await Role.findOne({
                _id: req.params.id,
                organizationId: req.user.organizationId
            });
            if (!role) throw new NotFoundError('Role');
            if (role.isSystem) throw new AppError('Cannot modify system roles', 403);

            Object.assign(role, req.body);
            await role.save();

            return success(res, role, 'Role updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const role = await Role.findOne({
                _id: req.params.id,
                organizationId: req.user.organizationId
            });
            if (!role) throw new NotFoundError('Role');
            if (role.isSystem) throw new AppError('Cannot delete system roles', 403);

            await role.deleteOne();
            return success(res, null, 'Role deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RoleController();
