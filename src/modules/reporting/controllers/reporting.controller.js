const svc = require('../services/reporting.service');
const { success } = require('../../../utils/response');

class ReportingController {
    async workload(req, res, next) { try { return success(res, { report: await svc.getWorkloadAnalysis() }); } catch (e) { next(e); } }
    async sla(req, res, next) { try { return success(res, { report: await svc.getSLAPerformance() }); } catch (e) { next(e); } }
    async burn(req, res, next) { try { return success(res, { report: await svc.getTimeBurnReport(req.params.projectId) }); } catch (e) { next(e); } }
    async bottleneck(req, res, next) { try { return success(res, { report: await svc.getBottleneckAnalysis() }); } catch (e) { next(e); } }
    async dashboardSummary(req, res, next) { try { return success(res, { report: await svc.getDashboardSummary() }); } catch (e) { next(e); } }
}

module.exports = new ReportingController();
