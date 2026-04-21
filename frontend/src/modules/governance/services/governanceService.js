import api from '../../../services/api/axios';

const workflowService = {
    transition: (data) => api.post('/workflows/transition', data),
    getHistory: (itemId) => api.get(`/workflows/history/${itemId}`),
};

const notificationService = {
    getNotifications: (params) => api.get('/notifications', { params }),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/mark-all-read'),
};

export { workflowService, notificationService };
