const authService = require('../services/auth.service');
const { success } = require('../../../utils/response');

class OrganizationController {
    async getOrganization(req, res, next) {
        try {
            const organization = await authService.getOrganization(req.user.organizationId);
            return success(res, { organization });
        } catch (e) {
            next(e);
        }
    }

    async updateOrganization(req, res, next) {
        try {
            const organization = await authService.updateOrganization(req.user.organizationId, req.body);
            return success(res, { organization });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new OrganizationController();
