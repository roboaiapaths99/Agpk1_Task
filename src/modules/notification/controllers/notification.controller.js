const svc = require('../services/notification.service');
const { success } = require('../../../utils/response');

class NotificationController {
    async getMy(req, res, next) { try { return success(res, { notifications: await svc.getMyNotifications(req.user.id, req.user.organizationId, req.query) }); } catch (e) { next(e); } }
    async markRead(req, res, next) { try { return success(res, { notification: await svc.markAsRead(req.params.id, req.user.id, req.user.organizationId) }); } catch (e) { next(e); } }
    async markAllRead(req, res, next) { try { await svc.markAllAsRead(req.user.id, req.user.organizationId); return success(res, null, 'All marked as read'); } catch (e) { next(e); } }
    async getUnreadCount(req, res, next) { try { return success(res, { count: await svc.getUnreadCount(req.user.id, req.user.organizationId) }); } catch (e) { next(e); } }
}

module.exports = new NotificationController();
