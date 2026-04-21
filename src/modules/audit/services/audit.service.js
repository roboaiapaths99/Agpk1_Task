const AuditLog = require('../models/AuditLog');
const logger = require('../../../core/logger');

const { getIO } = require('../../../socketServer');

class AuditService {
    async logAction(data) {
        try {
            // Automatically calculate diffs if oldData and newData are provided
            if (data.oldData && data.newData && !data.changes) {
                data.changes = this.calculateDiff(data.oldData, data.newData);
            }

            const log = await AuditLog.create(data);

            try {
                const io = getIO();
                io.to(`org:${data.organizationId}`).emit('audit:new', log);
            } catch (socketError) {
                // Silently ignore if socket.io is not initialized (e.g. in tests or migrations)
            }

            return log;
        } catch (error) {
            logger.error('Failed to create audit log:', error);
        }
    }

    /**
     * Calculate field-level differences between two objects
     * Performs deep comparison for objects and arrays
     */
    calculateDiff(oldObj, newObj, path = '') {
        const changes = [];
        const excludedFields = ['__v', 'updatedAt', 'createdAt', 'organizationId', '_id'];

        // Convert Mongoose documents to plain objects if needed
        const oldData = oldObj && typeof oldObj.toObject === 'function' ? oldObj.toObject() : (oldObj || {});
        const newData = newObj && typeof newObj.toObject === 'function' ? newObj.toObject() : (newObj || {});

        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

        allKeys.forEach(key => {
            if (excludedFields.includes(key)) return;

            const oldVal = oldData[key];
            const newVal = newData[key];
            const currentPath = path ? `${path}.${key}` : key;

            // Handle Nulls and Undefineds
            if (oldVal === newVal) return;

            // Handle primitive changes
            if (typeof oldVal !== 'object' || typeof newVal !== 'object' || oldVal === null || newVal === null) {
                changes.push({
                    field: currentPath,
                    oldValue: oldVal,
                    newValue: newVal
                });
                return;
            }

            // Handle Arrays
            if (Array.isArray(oldVal) || Array.isArray(newVal)) {
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    changes.push({
                        field: currentPath,
                        oldValue: oldVal,
                        newValue: newVal,
                        type: 'ARRAY_CHANGE'
                    });
                }
                return;
            }

            // Handle Nested Objects (Recursively)
            const subChanges = this.calculateDiff(oldVal, newVal, currentPath);
            changes.push(...subChanges);
        });

        return changes;
    }

    async getLogs(query = {}, options = {}) {
        const { limit = 50, skip = 0, sort = { timestamp: -1 } } = options;
        return AuditLog.find(query)
            .sort(sort)
            .limit(limit)
            .skip(skip)
            .populate('userId', 'name email');
    }

    async getEntityHistory(entityId) {
        return AuditLog.find({ entityId })
            .sort({ timestamp: -1 })
            .populate('userId', 'name email');
    }

    async getFilters() {
        const [modules, actions] = await Promise.all([
            AuditLog.distinct('module'),
            AuditLog.distinct('action')
        ]);

        const users = await AuditLog.aggregate([
            { $match: { userId: { $exists: true, $ne: null } } },
            { $group: { _id: '$userId' } },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { _id: 1, name: '$user.name', email: '$user.email' } }
        ]);

        return { modules, actions, users };
    }
}

module.exports = new AuditService();
