const svc = require('../services/autoTask.service');
const { success, created } = require('../../../utils/response');
class AutoTaskController {
    async create(req, res, next) { try { const r = await svc.createRule(req.body, req.user.id); return created(res, { rule: r }); } catch (e) { next(e); } }
    async getAll(req, res, next) { try { const rules = await svc.getRules(); return success(res, { rules }); } catch (e) { next(e); } }
    async update(req, res, next) { try { const r = await svc.updateRule(req.params.id, req.body); return success(res, { rule: r }); } catch (e) { next(e); } }
    async remove(req, res, next) { try { await svc.deleteRule(req.params.id); return success(res, null, 'Deleted'); } catch (e) { next(e); } }
}
module.exports = new AutoTaskController();
