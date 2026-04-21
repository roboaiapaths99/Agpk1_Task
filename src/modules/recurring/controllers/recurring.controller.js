const svc = require('../services/recurring.service');
const { success, created } = require('../../../utils/response');

class RecurringController {
    async create(req, res, next) { try { return created(res, { rule: await svc.createRule(req.body, req.user.id) }); } catch (e) { next(e); } }
    async getAll(req, res, next) { try { return success(res, { rules: await svc.getRules() }); } catch (e) { next(e); } }
    async update(req, res, next) { try { return success(res, { rule: await svc.updateRule(req.params.id, req.body) }); } catch (e) { next(e); } }
    async pause(req, res, next) { try { return success(res, { rule: await svc.updateRule(req.params.id, { isPaused: true }) }); } catch (e) { next(e); } }
    async resume(req, res, next) { try { return success(res, { rule: await svc.updateRule(req.params.id, { isPaused: false }) }); } catch (e) { next(e); } }
}

module.exports = new RecurringController();
