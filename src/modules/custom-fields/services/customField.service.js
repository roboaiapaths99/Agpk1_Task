const CustomField = require('../models/CustomField');
const mongoose = require('mongoose');

class CustomFieldService {
    async create(data) {
        // Validate dropdown options
        if (data.fieldType === 'dropdown' && (!data.options || data.options.length === 0)) {
            const error = new Error('Dropdown fields must have at least one option');
            error.statusCode = 400;
            throw error;
        }

        const field = await CustomField.create(data);
        return field;
    }

    async getAll({ organizationId, projectId, appliesTo }) {
        const filter = { organizationId };

        if (projectId) {
            // Return org-wide fields + project-specific fields
            filter.$or = [
                { projectId: null },
                { projectId: new mongoose.Types.ObjectId(projectId) },
            ];
        }

        if (appliesTo && appliesTo !== 'all') {
            filter.appliesTo = { $in: [appliesTo, 'all'] };
        }

        return CustomField.find(filter)
            .populate('createdBy', 'name email')
            .sort({ sortOrder: 1, createdAt: 1 })
            .lean();
    }

    async getById(fieldId, organizationId) {
        const field = await CustomField.findOne({ _id: fieldId, organizationId });
        if (!field) {
            const error = new Error('Custom field not found');
            error.statusCode = 404;
            throw error;
        }
        return field;
    }

    async update(fieldId, updates, organizationId) {
        // Don't allow changing fieldType after creation
        delete updates.fieldType;
        delete updates.organizationId;

        const field = await CustomField.findOneAndUpdate(
            { _id: fieldId, organizationId },
            updates,
            { new: true, runValidators: true }
        );

        if (!field) {
            const error = new Error('Custom field not found');
            error.statusCode = 404;
            throw error;
        }

        return field;
    }

    async remove(fieldId, organizationId) {
        const field = await CustomField.findOneAndDelete({ _id: fieldId, organizationId });
        if (!field) {
            const error = new Error('Custom field not found');
            error.statusCode = 404;
            throw error;
        }
        return { success: true, deletedField: field.name };
    }

    async reorder(fieldIds, organizationId) {
        const ops = fieldIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, organizationId },
                update: { sortOrder: index },
            },
        }));
        await CustomField.bulkWrite(ops);
        return { success: true };
    }
}

module.exports = new CustomFieldService();
