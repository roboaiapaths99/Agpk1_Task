const taskService = require('../services/task.service');
const { success, created } = require('../../../utils/response');

class ChecklistController {
    async addChecklist(req, res, next) {
        try {
            const checklist = await taskService.addChecklist(req.params.id, req.user.organizationId, req.body);
            return created(res, { checklist }, 'Checklist added');
        } catch (error) { next(error); }
    }

    async getChecklists(req, res, next) {
        try {
            const checklists = await taskService.getChecklists(req.params.id, req.user.organizationId);
            return success(res, { checklists });
        } catch (error) { next(error); }
    }

    async updateChecklistItem(req, res, next) {
        try {
            const checklist = await taskService.updateChecklistItem(req.params.checklistId, req.user.organizationId, req.params.itemId, req.body);
            return success(res, { checklist }, 'Checklist item updated');
        } catch (error) { next(error); }
    }

    async addItemToChecklist(req, res, next) {
        try {
            const checklist = await taskService.addItemToChecklist(req.params.checklistId, req.user.organizationId, req.body);
            return success(res, { checklist }, 'Item added to checklist');
        } catch (error) { next(error); }
    }

    async deleteChecklist(req, res, next) {

        try {
            await taskService.deleteChecklist(req.params.checklistId, req.user.organizationId);
            return success(res, null, 'Checklist deleted');
        } catch (error) { next(error); }
    }
}

module.exports = new ChecklistController();
