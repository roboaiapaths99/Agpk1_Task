const workflowService = require('../services/workflow.service');
const { success, created } = require('../../../utils/response');

class WorkflowController {
    async create(req, res, next) { try { const wf = await workflowService.createWorkflow(req.body, req.user.id, req.user.organizationId); return created(res, { workflow: wf }); } catch (e) { next(e); } }
    async getAll(req, res, next) { try { const workflows = await workflowService.getWorkflows(req.user.organizationId); return success(res, { workflows }); } catch (e) { next(e); } }
    async getById(req, res, next) { try { const wf = await workflowService.getWorkflowById(req.params.id, req.user.organizationId); return success(res, { workflow: wf }); } catch (e) { next(e); } }
    async update(req, res, next) { try { const wf = await workflowService.updateWorkflow(req.params.id, req.user.organizationId, req.body); return success(res, { workflow: wf }, 'Updated'); } catch (e) { next(e); } }
    async transition(req, res, next) { try { const task = await workflowService.moveTaskState(req.body.taskId, req.body.toState, req.user.id, req.user.organizationId, req.body.reason); return success(res, { task }, 'State changed'); } catch (e) { next(e); } }
    async history(req, res, next) { try { const logs = await workflowService.getTransitionHistory(req.params.taskId, req.user.organizationId); return success(res, { transitions: logs }); } catch (e) { next(e); } }
}

module.exports = new WorkflowController();
