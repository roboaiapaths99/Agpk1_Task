import api from '../../../services/api/axios';

const taskService = {
    getTasks: (params) => api.get('/tasks', { params }),
    getKanban: () => api.get('/views/kanban'),
    getTask: (id) => api.get(`/tasks/${id}`),
    createTask: (data) => api.post('/tasks', data),
    updateTask: (id, data) => api.patch(`/tasks/${id}`, data),
    deleteTask: (id) => api.delete(`/tasks/${id}`),
    changeStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
    addComment: (taskId, content) => api.post(`/tasks/${taskId}/comments`, { content }),
    toggleChecklist: (taskId, itemId) => api.patch(`/tasks/${taskId}/checklist/${itemId}`),
};

export default taskService;
