const svc = require('../services/approval.service');
const { success, created } = require('../../../utils/response');
class ApprovalController {
    async createChain(req, res, next) { try { const c = await svc.createChain(req.body, req.user.id, req.user.organizationId); return created(res, { chain: c }); } catch (e) { next(e); } }
    async getChains(req, res, next) { try { return success(res, { chains: await svc.getChains(req.user.organizationId) }); } catch (e) { next(e); } }
    async request(req, res, next) { try { const r = await svc.requestApproval(req.body.taskId, req.body.chainId, req.user.id, req.user.organizationId); return created(res, { request: r }); } catch (e) { next(e); } }
    async approve(req, res, next) { try { const r = await svc.approve(req.params.id, req.user.id, req.user.organizationId, req.body.comment); return success(res, { request: r }, 'Approved'); } catch (e) { next(e); } }
    async reject(req, res, next) { try { const r = await svc.reject(req.params.id, req.user.id, req.user.organizationId, req.body.comment); return success(res, { request: r }, 'Rejected'); } catch (e) { next(e); } }
    async pending(req, res, next) { try { return success(res, { approvals: await svc.getPendingApprovals(req.user.id, req.user.organizationId) }); } catch (e) { next(e); } }
    async getById(req, res, next) { try { return success(res, { request: await svc.getRequestById(req.params.id, req.user.organizationId) }); } catch (e) { next(e); } }
    async history(req, res, next) { try { return success(res, { history: await svc.getApprovalHistory(req.user.id, req.user.organizationId, req.query) }); } catch (e) { next(e); } }
}
module.exports = new ApprovalController();
