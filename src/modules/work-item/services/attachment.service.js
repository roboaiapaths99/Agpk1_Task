const Attachment = require('../models/Attachment');
const fs = require('fs');

class AttachmentService {
    async createAttachment(data) {
        return await Attachment.create(data);
    }

    async getById(id, organizationId) {
        return await Attachment.findOne({ _id: id, organizationId });
    }

    async getByTask(taskId, organizationId) {
        return await Attachment.find({ taskId, organizationId }).populate('uploadedBy', 'name');
    }

    async getByProject(projectId, organizationId) {
        return await Attachment.find({ projectId, organizationId }).populate('uploadedBy', 'name');
    }

    async deleteAttachment(id, organizationId, userId) {
        const attachment = await Attachment.findOne({ _id: id, organizationId });
        if (!attachment) throw new Error('Attachment not found');

        // Only uploader can delete
        if (attachment.uploadedBy.toString() !== userId.toString()) {
            throw new Error('Unauthorized');
        }

        // Delete file from disk
        if (fs.existsSync(attachment.path)) {
            try {
                fs.unlinkSync(attachment.path);
            } catch (err) {
                console.error('Failed to delete file from disk:', err);
            }
        }

        await attachment.deleteOne();
        return true;
    }
}

module.exports = new AttachmentService();
