const SLAPolicy = require('../models/SLAPolicy');
const { NotFoundError } = require('../../../core/errors');

class SLAController {
    async getPolicies(req, res, next) {
        try {
            const { organizationId } = req.user;
            const policies = await SLAPolicy.find({ organizationId });
            res.json({ success: true, data: policies });
        } catch (error) {
            next(error);
        }
    }

    async createPolicy(req, res, next) {
        try {
            const { organizationId } = req.user;
            const policy = await SLAPolicy.create({
                ...req.body,
                organizationId
            });
            res.status(201).json({ success: true, data: policy });
        } catch (error) {
            next(error);
        }
    }

    async updatePolicy(req, res, next) {
        try {
            const { organizationId } = req.user;
            const { id } = req.params;

            const policy = await SLAPolicy.findOneAndUpdate(
                { _id: id, organizationId },
                req.body,
                { new: true, runValidators: true }
            );

            if (!policy) throw new NotFoundError('SLA Policy');
            res.json({ success: true, data: policy });
        } catch (error) {
            next(error);
        }
    }

    async deletePolicy(req, res, next) {
        try {
            const { organizationId } = req.user;
            const { id } = req.params;

            const policy = await SLAPolicy.findOneAndDelete({ _id: id, organizationId });
            if (!policy) throw new NotFoundError('SLA Policy');
            res.json({ success: true, message: 'Policy deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SLAController();

