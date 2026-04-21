import api from './axios';

// ─── Project Service ────────────────────────────────────────
export const projectService = {
    getAll: (params) => api.get('/projects', { params }),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.patch(`/projects/${id}`, data),
    remove: (id) => api.delete(`/projects/${id}`),
    addMilestone: (id, data) => api.post(`/projects/${id}/milestones`, data),
    getMilestones: (id) => api.get(`/projects/${id}/milestones`),
    addDependency: (id, data) => api.post(`/projects/${id}/dependencies`, data),
    getDependencies: (id) => api.get(`/projects/${id}/dependencies`),
    getGantt: (id) => api.get(`/projects/${id}/gantt`),
};

// ─── Sprint Service ─────────────────────────────────────────
export const sprintService = {
    create: (data) => api.post('/sprints', data),
    getByProject: (projectId) => api.get(`/sprints/project/${projectId}`),
    update: (id, data) => api.patch(`/sprints/${id}`, data),
    remove: (id) => api.delete(`/sprints/${id}`),
    complete: (id) => api.post(`/sprints/${id}/complete`),
};

// ─── Approval Service ───────────────────────────────────────
export const approvalService = {
    getPending: () => api.get('/approvals/pending'),
    getById: (id) => api.get(`/approvals/${id}`),
    approve: (id, data) => api.post(`/approvals/${id}/approve`, data),
    reject: (id, data) => api.post(`/approvals/${id}/reject`, data),
    request: (data) => api.post('/approvals/request', data),
    createChain: (data) => api.post('/approvals/chains', data),
    getChains: () => api.get('/approvals/chains'),
    getHistory: (params) => api.get('/approvals/history', { params }),
};

// ─── Automation Service ─────────────────────────────────────
export const automationService = {
    getRules: () => api.get('/automation/rules'),
    createRule: (data) => api.post('/automation/rules', data),
    updateRule: (id, data) => api.patch(`/automation/rules/${id}`, data),
    deleteRule: (id) => api.delete(`/automation/rules/${id}`),
};

// ─── Report Service ─────────────────────────────────────────
export const reportService = {
    getWorkload: () => api.get('/reports/workload'),
    getSla: () => api.get('/reports/sla'),
    getDashboardSummary: () => api.get('/reports/dashboard-summary'),
    getBottleneck: () => api.get('/reports/bottleneck'),
    getBurn: (projectId) => api.get(`/reports/burn/${projectId}`),
};

// ─── Time Tracking Service ──────────────────────────────────
export const timeService = {
    start: (taskId) => api.post('/time/start', { taskId }),
    stop: (taskId) => api.post('/time/stop', { taskId }),
    getActive: () => api.get('/time/active'),
    myLogs: () => api.get('/time/me'),
    taskLogs: (taskId) => api.get(`/time/task/${taskId}`),
    manual: (data) => api.post('/time/manual', data),
};

// ─── AI Service ─────────────────────────────────────────────
export const aiService = {
    suggestAssignee: (taskId) => api.get(`/ai/suggest-assignee/${taskId}`),
    predictRisk: (taskId) => api.get(`/ai/predict-risk/${taskId}`),
    breakdownEpic: (epicId) => api.post(`/ai/breakdown-epic`, { epicId }),
    predictTeamHealth: () => api.get('/ai/team-health'),
    generateWorkflow: (prompt) => api.post('/ai/generate-workflow', { prompt }),
    generateContent: (prompt, context) => api.post('/ai/generate-content', { prompt, context }),
    getForecast: (projectId) => api.get(`/ai/forecast/${projectId}`),
};

// ─── Guest Service ──────────────────────────────────────────
export const guestService = {
    getProject: (token) => api.get(`/guest/${token}`),
    createLink: (projectId) => api.post(`/guest/create`, { projectId }),
};

// ─── Integration Service ────────────────────────────────────
export const integrationService = {
    handleWebhook: (payload) => api.post('/integration/webhook', payload),
};

// ─── Notification Service ───────────────────────────────────
export const notificationService = {
    getAll: (params) => api.get('/notifications', { params }),
    getUnreadCount: () => api.get('/notifications/unread/count'),
    markRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/read-all'),
};

// ─── Audit Service ──────────────────────────────────────────
export const auditService = {
    getLogs: (params) => api.get('/audit/logs', { params }),
    getFilters: () => api.get('/audit/filters'),
    getEntityHistory: (id) => api.get(`/audit/history/${id}`),
    exportEntityHistory: (id) => api.get(`/audit/history/${id}/export`),
};

// ─── RBAC Service ───────────────────────────────────────────
export const rolesService = {
    getAll: () => api.get('/auth/roles'),
    getById: (id) => api.get(`/auth/roles/${id}`),
    create: (data) => api.post('/auth/roles', data),
    update: (id, data) => api.patch(`/auth/roles/${id}`, data),
    remove: (id) => api.delete(`/auth/roles/${id}`),
};

export const commonService = {
    search: (query) => api.get(`/search?q=${query}`),
};

// ─── Workflow Service ───────────────────────────────────────
export const workflowService = {
    getAll: () => api.get('/workflows'),
    getById: (id) => api.get(`/workflows/${id}`),
    create: (data) => api.post('/workflows', data),
    update: (id, data) => api.patch(`/workflows/${id}`, data),
    remove: (id) => api.delete(`/workflows/${id}`),
    transition: (data) => api.post('/workflows/transition', data),
    getHistory: (taskId) => api.get(`/workflows/history/${taskId}`),
};

// ─── Health Service ─────────────────────────────────────────
export const healthService = {
    getTeamScore: () => api.get('/health/team-score'),
};

// ─── Auth Service (profile management) ──────────────────────
export const profileService = {
    getMe: () => api.get('/auth/me'),
    updateMe: (data) => api.patch('/auth/me', data),
    changePassword: (data) => api.patch('/auth/change-password', data),
    updateNotificationPrefs: (data) => api.patch('/auth/me/notification-preferences', data),
    getAllUsers: () => api.get('/auth/users'),
    getHierarchy: () => api.get('/auth/hierarchy'),
    updateHierarchy: (data) => api.post('/auth/hierarchy', data),
    updateDashboardLayout: (layout) => api.patch('/auth/dashboard-layout', { layout }),
};

// ─── Organization Service ───────────────────────────────────
export const organizationService = {
    get: () => api.get('/auth/organization'),
    update: (data) => api.patch('/auth/organization', data),
};

// ─── SLA Service ────────────────────────────────────────────
export const slaService = {
    getAll: () => api.get('/sla'),
    create: (data) => api.post('/sla', data),
    update: (id, data) => api.put(`/sla/${id}`, data),
    remove: (id) => api.delete(`/sla/${id}`),
};

// ─── Operations Service ────────────────────────────────────
export const operationsService = {
    exportTasks: (params) => api.get('/operations/export/tasks', {
        params,
        responseType: 'blob'
    }),
    exportInvoicesExcel: (params) => api.get('/operations/export/invoices/excel', {
        params,
        responseType: 'blob'
    }),
    exportTasksExcel: (params) => api.get('/operations/export/tasks/excel', {
        params,
        responseType: 'blob'
    }),
    exportExpensesExcel: (params) => api.get('/operations/export/expenses/excel', {
        params,
        responseType: 'blob'
    }),
    exportJournalExcel: (params) => api.get('/operations/export/journal/excel', {
        params,
        responseType: 'blob'
    }),
    exportProjectsExcel: (params) => api.get('/operations/export/projects/excel', {
        params,
        responseType: 'blob'
    }),
    exportTaxExcel: (params) => api.get('/operations/export/tax/excel', {
        params,
        responseType: 'blob'
    }),
};

// ─── Attachment Service ─────────────────────────────────────
export const attachmentService = {
    upload: (formData) => api.post('/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getByTask: (taskId) => api.get(`/attachments/task/${taskId}`),
    getByProject: (projectId) => api.get(`/attachments/project/${projectId}`),
    remove: (id) => api.delete(`/attachments/${id}`),
};

// ─── Task Service (re-export for convenience) ───────────────
export const taskService = {
    getAll: (params) => api.get('/tasks', { params }),
    getKanban: () => api.get('/views/kanban'),
    getCalendar: () => api.get('/views/calendar'),
    getTimeline: (params) => api.get('/views/timeline', { params }),
    getMyTasks: () => api.get('/views/my-tasks'),
    getOverdue: () => api.get('/views/overdue'),
    getById: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.patch(`/tasks/${id}`, data),
    remove: (id) => api.delete(`/tasks/${id}`),
    delete: (id) => api.delete(`/tasks/${id}`),
    assign: (id, data) => api.post(`/tasks/${id}/assign`, data),
    changeStatus: (id, status, reason) => api.patch(`/tasks/${id}/status`, { status, reason }),
    addWatcher: (id, data) => api.post(`/tasks/${id}/watchers`, data),
    removeWatcher: (id, data) => api.delete(`/tasks/${id}/watchers`, { data }),
    // Comments
    getComments: (id) => api.get(`/tasks/${id}/comments`),
    addComment: (id, content) => api.post(`/tasks/${id}/comments`, { content }),
    // Checklists
    getChecklists: (id) => api.get(`/tasks/${id}/checklists`),
    addChecklist: (id, data) => api.post(`/tasks/${id}/checklists`, data),
    addChecklistItem: (checklistId, data) => api.post(`/tasks/checklists/${checklistId}/items`, data),
    toggleChecklistItem: (checklistId, itemId) => api.patch(`/tasks/checklists/${checklistId}/items/${itemId}`),

    getSubTasks: (id) => api.get(`/tasks/${id}/subtasks`),
    createSubTask: (id, data) => api.post('/tasks', { ...data, parent: id }),
    addDependency: (id, data) => api.post(`/tasks/${id}/dependencies`, data),
    removeDependency: (id, data) => api.delete(`/tasks/${id}/dependencies`, { data }),
};

// ─── Doc / Wiki Service ─────────────────────────────────────
export const docService = {
    getAll: (params) => api.get('/docs', { params }),
    getById: (id) => api.get(`/docs/${id}`),
    create: (data) => api.post('/docs', data),
    update: (id, data) => api.patch(`/docs/${id}`, data),
    archive: (id) => api.delete(`/docs/${id}`),
    linkTask: (id, taskId) => api.post(`/docs/${id}/link-task`, { taskId }),
    unlinkTask: (id, taskId) => api.delete(`/docs/${id}/link-task`, { data: { taskId } }),
    getTemplates: () => api.get('/docs/templates'),
    getTree: (projectId) => api.get('/docs/tree', { params: { projectId } }),
};

// ─── Custom Field Service ───────────────────────────────────
export const customFieldService = {
    getAll: (params) => api.get('/custom-fields', { params }),
    getById: (id) => api.get(`/custom-fields/${id}`),
    create: (data) => api.post('/custom-fields', data),
    update: (id, data) => api.patch(`/custom-fields/${id}`, data),
    remove: (id) => api.delete(`/custom-fields/${id}`),
    reorder: (fieldIds) => api.post('/custom-fields/reorder', { fieldIds }),
};

// ─── OKR Service ────────────────────────────────────────────
export const okrService = {
    getDashboard: (period) => api.get('/okrs/dashboard', { params: { period } }),
    createObjective: (data) => api.post('/okrs/objectives', data),
    getObjectives: (params) => api.get('/okrs/objectives', { params }),
    getObjectiveById: (id) => api.get(`/okrs/objectives/${id}`),
    updateObjective: (id, data) => api.patch(`/okrs/objectives/${id}`, data),
    deleteObjective: (id) => api.delete(`/okrs/objectives/${id}`),
    createKeyResult: (data) => api.post('/okrs/key-results', data),
    updateKeyResult: (id, data) => api.patch(`/okrs/key-results/${id}`, data),
    deleteKeyResult: (id) => api.delete(`/okrs/key-results/${id}`),
    linkTasks: (krId, taskIds) => api.post(`/okrs/key-results/${krId}/link-tasks`, { taskIds }),
};

// ─── Integration Service ────────────────────────────────────
export const integrationConfigService = {
    getStatus: () => api.get('/integrations/status'),
    // GitHub
    githubConnect: (data) => api.post('/integrations/github/connect', data),
    githubDisconnect: () => api.delete('/integrations/github/disconnect'),
    githubStatus: () => api.get('/integrations/github/status'),
    // Slack
    slackConnect: (data) => api.post('/integrations/slack/connect', data),
    slackDisconnect: () => api.delete('/integrations/slack/disconnect'),
    slackStatus: () => api.get('/integrations/slack/status'),
    slackTest: () => api.post('/integrations/slack/test'),
    // Figma
    figmaConnect: (data) => api.post('/integrations/figma/connect', data),
    figmaDisconnect: () => api.delete('/integrations/figma/disconnect'),
    figmaStatus: () => api.get('/integrations/figma/status'),
};

// ─── Work Graph Service ────────────────────────────────────
export const workGraphService = {
    getGraph: (projectId) => api.get(`/work-graph/${projectId}`),
};

// ─── Standup Service ─────────────────────────────────────
export const standupService = {
    submit: (data) => api.post('/standups/submit', data),
    getTeam: (date) => api.get('/standups/team', { params: { date } }),
    getMe: () => api.get('/standups/me'),
};

// ─── Finance: Invoice Service ────────────────────────────────
export const invoiceService = {
    getAll: (params) => api.get('/finance/invoices', { params }),
    getById: (id) => api.get(`/finance/invoices/${id}`),
    create: (data) => api.post('/finance/invoices', data),
    update: (id, data) => api.patch(`/finance/invoices/${id}`, data),
    remove: (id) => api.delete(`/finance/invoices/${id}`),
    restore: (id) => api.patch(`/finance/invoices/${id}/restore`),
    issueCreditNote: (id, data) => api.post(`/finance/invoices/${id}/credit-note`, data),
    exportExcel: (data) => api.post('/finance/invoices/export/excel', data),
    downloadInvoice: (id) => api.get(`/finance/invoices/${id}/download`),
    triggerDunning: () => api.post('/finance/invoices/dunning/trigger'),
};

// ─── Finance: Expense Service ────────────────────────────────
export const expenseService = {
    getAll: (params) => api.get('/finance/expenses', { params }),
    getById: (id) => api.get(`/finance/expenses/${id}`),
    create: (data) => api.post('/finance/expenses', data),
    update: (id, data) => api.patch(`/finance/expenses/${id}`, data),
    remove: (id) => api.delete(`/finance/expenses/${id}`),
    restore: (id) => api.patch(`/finance/expenses/${id}/restore`),
    exportExcel: (data) => api.post('/finance/expenses/export/excel', data),
};

// ─── Finance: Payment Service ────────────────────────────────
export const paymentService = {
    getAll: (params) => api.get('/finance/payments', { params }),
    record: (data) => api.post('/finance/payments', data),
    getByInvoice: (invoiceId) => api.get(`/finance/payments/invoice/${invoiceId}`),
};

// ─── Finance: Ledger Service ─────────────────────────────────
export const ledgerService = {
    getTrialBalance: (params) => api.get('/finance/ledger/trial-balance', { params }),
    postManualEntry: (data) => api.post('/finance/ledger/manual-entry', data),
    getHealth: () => api.get('/finance/ledger/health'),
};

export const accountService = {
    getAll: (params) => api.get('/finance/accounts', { params }),
    getTree: () => api.get('/finance/accounts/tree'),
    getById: (id) => api.get(`/finance/accounts/${id}`),
    create: (data) => api.post('/finance/accounts', data),
    update: (id, data) => api.patch(`/finance/accounts/${id}`, data),
    remove: (id) => api.delete(`/finance/accounts/${id}`),
    seedDefaults: () => api.post('/finance/accounts/seed-defaults'),
};

export const journalService = {
    getAll: (params) => api.get('/finance/journal', { params }),
    getById: (id) => api.get(`/finance/journal/${id}`),
    create: (data) => api.post('/finance/journal', data),
    reverse: (id) => api.post(`/finance/journal/${id}/reverse`),
    void: (id) => api.patch(`/finance/journal/${id}/void`),
};

// ─── Finance: Report Service ─────────────────────────────────
export const financeReportService = {
    getDashboard: (params) => api.get('/finance/reports/dashboard', { params }),
    getPLReport: (params) => api.get('/finance/reports/profit-loss', { params }),
    getBalanceSheet: (params) => api.get('/finance/reports/balance-sheet', { params }),
    getCashFlow: (params) => api.get('/finance/reports/cash-flow', { params }),
    getARAging: (params) => api.get('/finance/reports/ar-aging', { params }),
    getAPAging: (params) => api.get('/finance/reports/ap-aging', { params }),
    getDunningList: (params) => api.get('/finance/reports/dunning-list', { params }),
    recordDunningAction: (data) => api.post('/finance/reports/dunning-action', data),
    getDunningHistory: (params) => api.get('/finance/reports/dunning-history', { params }),
};

// ─── Finance: Compliance Service ──────────────────────────────
// ─── Finance: Branch Service ─────────────────────────────────
export const branchService = {
    getAll: (params) => api.get('/finance/branches', { params }),
    getById: (id) => api.get(`/finance/branches/${id}`),
    create: (data) => api.post('/finance/branches', data),
    update: (id, data) => api.patch(`/finance/branches/${id}`, data),
    remove: (id) => api.delete(`/finance/branches/${id}`),
};


export const complianceService = {
    getSettings: () => api.get('/finance/compliance/settings'),
    lockPeriod: (data) => api.post('/finance/compliance/lock-period', data),
    verifyAudit: () => api.get('/finance/compliance/verify-audit'),
};

export const reconciliationService = {
    getStatements: (params) => api.get('/finance/reconciliation', { params }),
    uploadStatement: (formData) => api.post('/finance/reconciliation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    autoMatch: (statementId) => api.post('/finance/reconciliation/auto-match', { statementId }),
    matchPayment: (data) => api.post('/finance/reconciliation/match', data),
};


export const budgetService = {
    getAll: (params) => api.get('/finance/budgets', { params }),
    getById: (id) => api.get(`/finance/budgets/${id}`),
    create: (data) => api.post('/finance/budgets', data),
    update: (id, data) => api.patch(`/finance/budgets/${id}`, data),
    remove: (id) => api.delete(`/finance/budgets/${id}`),
    sync: () => api.post('/finance/budgets/sync'),
};

export const forecastingService = {
    getRevenueForecast: () => api.get('/finance/forecasting'),
};

export const taxService = {
    getConfigs: () => api.get('/finance/tax/configs'),
    createConfig: (data) => api.post('/finance/tax/configs', data),
    updateConfig: (id, data) => api.patch(`/finance/tax/configs/${id}`, data),
    deleteConfig: (id) => api.delete(`/finance/tax/configs/${id}`),
    getHistory: () => api.get('/finance/tax/configs/history'),
    calculate: (data) => api.post('/finance/tax/calculate', data),
};

