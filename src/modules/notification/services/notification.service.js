const Notification = require('../models/Notification');
const User = require('../../auth/models/User');
const logger = require('../../../core/logger');
const { NotFoundError } = require('../../../core/errors');

class NotificationService {
    async createNotification(userId, organizationId, data) {
        const user = await User.findOne({ _id: userId, organizationId });
        if (!user) return; // Silent fail if user not from this org

        // Check user's notification preferences before creating
        const prefs = user.notificationPreferences || {};

        // If in-app notifications are globally disabled, skip
        if (prefs.inApp === false) {
            logger.info(`[NOTIF] Skipped in-app for user ${userId} (disabled)`);
            return null;
        }

        // Check specific notification type preferences
        const notifKey = data.notifKey; // e.g. 'taskAssigned', 'approvalRequired', 'mentions'
        if (notifKey && prefs[notifKey] === false) {
            logger.info(`[NOTIF] Skipped "${notifKey}" for user ${userId} (preference disabled)`);
            return null;
        }

        // Remove internal-only field before persisting
        const { notifKey: _removed, ...notifData } = data;

        const notification = await Notification.create({ userId, organizationId, ...notifData });

        // Handle email delivery based on user preferences
        if (prefs.email !== false) {
            this._sendEmail(user.email, data.title, data.message);
        }

        if (prefs.push) {
            this._sendPush(user.id, data.title, data.message);
        }

        return notification;
    }

    async getMyNotifications(userId, organizationId, query = {}) {
        const f = { userId, organizationId };
        if (query.isRead !== undefined) f.isRead = query.isRead;
        if (query.filter === 'unread') f.isRead = false;
        if (query.filter === 'mentions') f.category = 'task'; // mentions come through task events
        if (query.filter === 'alerts') f.type = { $in: ['warning', 'error'] };
        const limit = parseInt(query.limit) || 20;
        const skip = parseInt(query.skip) || 0;

        return Notification.find(f).sort('-createdAt').limit(limit).skip(skip);
    }

    async markAsRead(id, userId, organizationId) {
        const n = await Notification.findOneAndUpdate({ _id: id, userId, organizationId }, { isRead: true }, { new: true });
        if (!n) throw new NotFoundError('Notification');
        return n;
    }

    async markAllAsRead(userId, organizationId) {
        return Notification.updateMany({ userId, organizationId, isRead: false }, { isRead: true });
    }

    async getUnreadCount(userId, organizationId) {
        return Notification.countDocuments({ userId, organizationId, isRead: false });
    }

    // Private delivery mockups
    async _sendEmail(email, subject, body) {
        logger.info(`[MOCK EMAIL] To: ${email}, Subject: ${subject}`);
    }

    async _sendPush(userId, title, body) {
        logger.info(`[MOCK PUSH] To User: ${userId}, Title: ${title}`);
    }
}

module.exports = new NotificationService();
