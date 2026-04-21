const automationService = require('../services/automation.service');
const { success, created } = require('../../../utils/response');

class AutomationController {
    async create(req, res, next) { try { const rule = await automationService.createRule(req.body, req.user.id, req.user.organizationId); return created(res, { rule }); } catch (e) { next(e); } }
    async getAll(req, res, next) { try { const rules = await automationService.getRules(req.user.organizationId, req.query); return success(res, { rules }); } catch (e) { next(e); } }
    async update(req, res, next) { try { const rule = await automationService.updateRule(req.params.id, req.user.organizationId, req.body); return success(res, { rule }, 'Updated'); } catch (e) { next(e); } }
    async remove(req, res, next) { try { await automationService.deleteRule(req.params.id, req.user.organizationId); return success(res, null, 'Deleted'); } catch (e) { next(e); } }
}
module.exports = new AutomationController();
