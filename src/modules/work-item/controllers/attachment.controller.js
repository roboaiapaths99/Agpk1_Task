const svc = require('../services/attachment.service');
const { success } = require('../../../utils/response');

class AttachmentController {
    async upload(req, res, next) {
        try {
            if (!req.file) throw new Error('No file uploaded');

            const attachment = await svc.createAttachment({
                taskId: req.body.taskId,
                projectId: req.body.projectId,
                organizationId: req.user.organizationId,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                uploadedBy: req.user.id
            });

            return success(res, { attachment });
        } catch (e) {
            next(e);
        }
    }

    async getByTask(req, res, next) {
        try {
            const attachments = await svc.getByTask(req.params.taskId, req.user.organizationId);
            return success(res, { attachments });
        } catch (e) {
            next(e);
        }
    }

    async getByProject(req, res, next) {
        try {
            const attachments = await svc.getByProject(req.params.projectId, req.user.organizationId);
            return success(res, { attachments });
        } catch (e) {
            next(e);
        }
    }

    async download(req, res, next) {
        try {
            const attachment = await svc.getById(req.params.id, req.user.organizationId);
            if (!attachment) throw new Error('Attachment not found');
            res.download(attachment.path, attachment.originalName);
        } catch (e) {
            next(e);
        }
    }

    async delete(req, res, next) {
        try {
            await svc.deleteAttachment(req.params.id, req.user.organizationId, req.user.id);
            return success(res, { message: 'Deleted' });
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new AttachmentController();
