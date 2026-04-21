const Branch = require('../../models/Branch');
const { AppError } = require('../../../../core/errors');

class BranchService {
    async createBranch(data, organizationId) {
        // Check for duplicate code in same organization
        const existingBranch = await Branch.findOne({ organizationId, code: data.code });
        if (existingBranch) {
            throw new AppError('Branch with this code already exists in your organization', 400);
        }

        const branch = await Branch.create({
            ...data,
            organizationId
        });

        return branch;
    }

    async getBranchById(id, organizationId) {
        const branch = await Branch.findOne({ _id: id, organizationId });
        if (!branch) throw new AppError('Branch not found', 404);
        return branch;
    }

    async updateBranch(id, data, organizationId) {
        const branch = await Branch.findOneAndUpdate(
            { _id: id, organizationId },
            { ...data },
            { new: true, runValidators: true }
        );
        if (!branch) throw new AppError('Branch not found', 404);
        return branch;
    }

    async deleteBranch(id, organizationId) {
        // We might want to check if branch is used in invoices/expenses before deletion
        // For now, let's just make it inactive or soft delete if model supports it.
        // The Branch model has isActive field.
        const branch = await Branch.findOneAndUpdate(
            { _id: id, organizationId },
            { isActive: false },
            { new: true }
        );
        if (!branch) throw new AppError('Branch not found', 404);
        return branch;
    }

    async listBranches(filters, organizationId) {
        const query = { organizationId };
        if (filters.isActive !== undefined) {
            query.isActive = filters.isActive === 'true';
        }
        
        return await Branch.find(query).sort({ name: 1 });
    }
}

module.exports = new BranchService();
