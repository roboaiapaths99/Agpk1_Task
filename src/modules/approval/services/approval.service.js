const { ApprovalChain, ApprovalRequest } = require('../models/Approval');
const { NotFoundError, ValidationError } = require('../../../core/errors');
const eventBus = require('../../../core/eventBus');
const { EVENTS } = require('../../../utils/constants');

class ApprovalService {
    async createChain(data, userId, organizationId) { return ApprovalChain.create({ ...data, createdBy: userId, organizationId }); }
    async getChains(organizationId) { return ApprovalChain.find({ organizationId, isActive: true }); }

    async requestApproval(taskId, chainId, userId, organizationId) {
        const chain = await ApprovalChain.findOne({ _id: chainId, organizationId });
        if (!chain) throw new NotFoundError('Approval Chain');

        const request = await ApprovalRequest.create({
            taskId, chainId, requestedBy: userId, organizationId, status: 'in_progress',
            steps: chain.steps.map((s) => ({ approver: s.approver, role: s.role, order: s.order, slaHours: s.slaHours, status: 'pending' })),
        });

        await eventBus.publish(EVENTS.APPROVAL_REQUESTED, { organizationId, requestId: request._id, taskId, chainId, requestedBy: userId, firstApprover: chain.steps[0]?.approver });
        return request;
    }

    async approve(requestId, userId, organizationId, comment = '') {
        const request = await ApprovalRequest.findOne({ _id: requestId, organizationId });
        if (!request) throw new NotFoundError('Approval Request');

        const step = request.steps.find((s) => s.status === 'pending' && s.approver.toString() === userId);
        if (!step) throw new ValidationError('You are not the current approver or step already decided');

        step.status = 'approved';
        step.comment = comment;
        step.decidedAt = new Date();
        request.currentStep += 1;

        const allApproved = request.steps.every((s) => s.status === 'approved');
        if (allApproved) {
            request.status = 'approved';
            request.completedAt = new Date();
            await eventBus.publish(EVENTS.APPROVAL_COMPLETED, { organizationId, requestId: request._id, taskId: request.taskId });
        } else {
            await eventBus.publish(EVENTS.APPROVAL_STEP_COMPLETED, { organizationId, requestId: request._id, taskId: request.taskId, step: step.order, approvedBy: userId });
        }

        await request.save();
        return request;
    }

    async reject(requestId, userId, organizationId, comment = '') {
        const request = await ApprovalRequest.findOne({ _id: requestId, organizationId });
        if (!request) throw new NotFoundError('Approval Request');

        const step = request.steps.find((s) => s.status === 'pending' && s.approver.toString() === userId);
        if (!step) throw new ValidationError('You are not the current approver');

        step.status = 'rejected';
        step.comment = comment;
        step.decidedAt = new Date();
        request.status = 'rejected';
        request.completedAt = new Date();
        await request.save();

        await eventBus.publish(EVENTS.APPROVAL_REJECTED, { organizationId, requestId: request._id, taskId: request.taskId, rejectedBy: userId });
        return request;
    }

    async getPendingApprovals(userId, organizationId) {
        return ApprovalRequest.find({ organizationId, 'steps.approver': userId, 'steps.status': 'pending', status: 'in_progress' })
            .populate('taskId', 'title priority').populate('requestedBy', 'name');
    }

    async getRequestById(id, organizationId) {
        const req = await ApprovalRequest.findOne({ _id: id, organizationId }).populate('taskId').populate('requestedBy', 'name').populate('steps.approver', 'name email');
        if (!req) throw new NotFoundError('Approval Request');
        return req;
    }

    async getApprovalHistory(userId, organizationId, query = {}) {
        const limit = parseInt(query.limit) || 10;
        return ApprovalRequest.find({
            organizationId,
            $or: [
                { requestedBy: userId },
                { 'steps.approver': userId, 'steps.status': { $in: ['approved', 'rejected'] } }
            ]
        })
            .populate('taskId', 'title')
            .populate('requestedBy', 'name')
            .sort('-updatedAt')
            .limit(limit);
    }
}

module.exports = new ApprovalService();
