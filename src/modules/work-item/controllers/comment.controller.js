const taskService = require('../services/task.service');
const { success, created } = require('../../../utils/response');

class CommentController {
    async addComment(req, res, next) {
        try {
            const comment = await taskService.addComment(req.params.id, req.user.organizationId, req.body, req.user.id);
            return created(res, { comment }, 'Comment added');
        } catch (error) { next(error); }
    }

    async getComments(req, res, next) {
        try {
            const result = await taskService.getComments(req.params.id, req.user.organizationId, req.query);
            return res.json({ success: true, ...result });
        } catch (error) { next(error); }
    }

    async updateComment(req, res, next) {
        try {
            const comment = await taskService.updateComment(req.params.commentId, req.user.organizationId, req.body.content, req.user.id);
            return success(res, { comment }, 'Comment updated');
        } catch (error) { next(error); }
    }

    async deleteComment(req, res, next) {
        try {
            await taskService.deleteComment(req.params.commentId, req.user.organizationId, req.user.id);
            return success(res, null, 'Comment deleted');
        } catch (error) { next(error); }
    }
}

module.exports = new CommentController();
