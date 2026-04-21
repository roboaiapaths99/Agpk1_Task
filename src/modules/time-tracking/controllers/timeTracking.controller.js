const svc = require('../services/timeTracking.service');
const { success, created } = require('../../../utils/response');

class TimeTrackingController {
    async start(req, res, next) { try { return created(res, { log: await svc.startTimer(req.body.taskId, req.user.id, req.user.organizationId, req.body.description) }); } catch (e) { next(e); } }
    async stop(req, res, next) { try { return success(res, { log: await svc.stopTimer(req.user.id, req.user.organizationId) }); } catch (e) { next(e); } }
    async getActive(req, res, next) { try { return success(res, { log: await svc.getActiveTimer(req.user.id, req.user.organizationId) }); } catch (e) { next(e); } }
    async myLogs(req, res, next) { try { return success(res, { logs: await svc.getMyLogs(req.user.id, req.user.organizationId, req.query) }); } catch (e) { next(e); } }
    async taskLogs(req, res, next) { try { return success(res, { logs: await svc.getTaskLogs(req.params.taskId, req.user.organizationId) }); } catch (e) { next(e); } }
    async manual(req, res, next) { try { return created(res, { log: await svc.addManualEntry(req.body, req.user.id, req.user.organizationId) }); } catch (e) { next(e); } }
}

module.exports = new TimeTrackingController();
