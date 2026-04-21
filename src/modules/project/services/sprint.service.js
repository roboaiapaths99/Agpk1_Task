const Sprint = require('../models/Sprint');
const Task = require('../../work-item/models/Task');
const { NotFoundError, ValidationError } = require('../../../core/errors');
const { withTransaction } = require('../../../utils/transaction');

class SprintService {
    async createSprint(data) {
        if (!data.organizationId) {
            throw new ValidationError('organizationId is required to create a sprint');
        }
        return await Sprint.create(data);
    }

    async getSprints(projectId, organizationId) {
        return await Sprint.find({ projectId, organizationId }).sort('-createdAt');
    }

    async updateSprint(id, organizationId, data) {
        const sprint = await Sprint.findOneAndUpdate({ _id: id, organizationId }, data, { new: true, runValidators: true });
        if (!sprint) throw new NotFoundError('Sprint');
        return sprint;
    }

    async deleteSprint(id, organizationId) {
        const sprint = await Sprint.findOneAndDelete({ _id: id, organizationId });
        if (!sprint) throw new NotFoundError('Sprint');
        return sprint;
    }

    async getActiveSprint(projectId, organizationId) {
        return await Sprint.findOne({ projectId, organizationId, status: 'active' });
    }

    /**
     * Complete a sprint — wrapped in an ACID transaction so the sprint
     * status update and incomplete task reassignment are atomic.
     */
    async completeSprint(id, organizationId) {
        return await withTransaction(async (session) => {
            const sprint = await Sprint.findOne({ _id: id, organizationId }).session(session);
            if (!sprint) throw new NotFoundError('Sprint');

            sprint.status = 'completed';
            sprint.endDate = new Date();
            await sprint.save({ session });

            // Move incomplete tasks back to backlog — atomic with sprint close
            await Task.updateMany(
                { sprint: id, organizationId, status: { $ne: 'completed' } },
                { $set: { sprint: null } },
                { session }
            );

            return sprint;
        });
    }
}

module.exports = new SprintService();
