const User = require('../modules/auth/models/User');
const logger = require('../core/logger');

/**
 * Migration to backfill default permissions for existing users
 */
exports.up = async () => {
    const users = await User.find({ permissions: { $exists: false } });

    logger.info(`Backfilling permissions for ${users.length} users...`);

    const rolePermissions = {
        user: ['tasks:read', 'tasks:create', 'tasks:update', 'profile:update'],
        manager: [
            'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
            'profile:update', 'organization:read', 'organization:update',
            'users:read'
        ],
        admin: [
            'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
            'profile:update', 'organization:read', 'organization:update',
            'users:read', 'users:manage', 'site:admin'
        ]
    };

    for (const user of users) {
        user.permissions = rolePermissions[user.role] || rolePermissions.user;
        await user.save({ validateBeforeSave: false });
    }

    // Also update users with empty permissions array
    const emptyUsers = await User.updateMany(
        { permissions: { $size: 0 } },
        { $set: { permissions: rolePermissions.user } } // Safe default for bulk update
    );

    logger.info(`Migration completed. Updated existing users.`);
};
