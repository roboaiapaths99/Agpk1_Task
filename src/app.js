const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const { xssSanitizer } = require('./middlewares/sanitization');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { auditMiddleware } = require('./middlewares/audit.middleware');
const logger = require('./core/logger');

// Import route modules
const authRoutes = require('./modules/auth/routes/auth.routes');
const taskRoutes = require('./modules/work-item/routes/task.routes');
const commentRoutes = require('./modules/work-item/routes/comment.routes');
const checklistRoutes = require('./modules/work-item/routes/checklist.routes');
const viewRoutes = require('./modules/work-item/routes/view.routes');
const workflowRoutes = require('./modules/workflow/routes/workflow.routes');
const automationRoutes = require('./modules/automation/routes/automation.routes');
const autoTaskRoutes = require('./modules/auto-task/routes/autoTask.routes');
const approvalRoutes = require('./modules/approval/routes/approval.routes');
const projectRoutes = require('./modules/project/routes/project.routes');
const sprintRoutes = require('./modules/project/routes/sprint.routes');
const attachmentRoutes = require('./modules/work-item/routes/attachment.routes');
const searchRoutes = require('./modules/common/routes/search.routes');
const recurringRoutes = require('./modules/recurring/routes/recurring.routes');
const timeTrackingRoutes = require('./modules/time-tracking/routes/timeTracking.routes');
const notificationRoutes = require('./modules/notification/routes/notification.routes');
const reportingRoutes = require('./modules/reporting/routes/reporting.routes');
const auditRoutes = require('./modules/audit/routes/audit.routes');
const aiRoutes = require('./modules/ai/routes/ai.routes');
const healthRoutes = require('./modules/health/routes/health.routes');
const workGraphRoutes = require('./modules/work-graph/routes/workGraph.routes');
const pluginRoutes = require('./modules/plugin/routes/plugin.routes');
const integrationRoutes = require('./modules/integration/routes/integration.routes');
const guestRoutes = require('./modules/project/routes/guest.routes');
const docRoutes = require('./modules/docs/routes/doc.routes');
const customFieldRoutes = require('./modules/custom-fields/routes/customField.routes');
const okrRoutes = require('./modules/okr/routes/okr.routes');
const resourceRoutes = require('./modules/resource/routes/resource.routes');
const globalSearchRoutes = require('./modules/search/routes/search.routes');
const slaRoutes = require('./modules/work-item/routes/sla.routes');
const exportRoutes = require('./modules/operations/routes/export.routes');
const standupRoutes = require('./modules/health/routes/standup.routes');
const messagingRoutes = require('./modules/messaging/routes/messaging.routes');

// Finance routes
const invoiceRoutes = require('./modules/finance/invoice/routes/invoice.routes');
const paymentRoutes = require('./modules/finance/payments/routes/payment.routes');
const ledgerRoutes = require('./modules/finance/ledger/routes/ledger.routes');
const expenseRoutes = require('./modules/finance/expenses/routes/expense.routes');
const financeReportRoutes = require('./modules/finance/reports/routes/report.routes');
const reconciliationRoutes = require('./modules/finance/reconciliation/routes/reconciliation.routes');
const branchRoutes = require('./modules/finance/branch/routes/branch.routes');
const complianceRoutes = require('./modules/finance/compliance/routes/compliance.routes');
const budgetRoutes = require('./modules/finance/budget/routes/budget.routes');
const payrollRoutes = require('./modules/finance/payroll/routes/payroll.routes');
const financeRecurringRoutes = require('./modules/finance/recurring/routes/recurring.routes');

const app = express();
app.set('trust proxy', 1);
logger.info('🚀 App initialization started: Loading middleware and routes...');

// Health Check for Production
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString() 
    });
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/temp', express.static(path.join(process.cwd(), 'public/temp')));

// ======================
// Global Middlewares
// ======================
app.use(helmet());

// CORS Hardening
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) 
    : [];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development';
        
        if (isAllowed) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['set-cookie']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP Parameter Pollution protection (temporarily disabled due to Express 5 getter conflicts)
// app.use(hpp());

// Data Sanitization against NoSQL Injection (temporarily disabled due to Express 5 getter conflicts)
// app.use(mongoSanitize());

// Data Sanitization against XSS
app.use(xssSanitizer);

app.use(globalLimiter);

// Automated Audit Logging for all mutations
app.use(auditMiddleware());

// HTTP request logging
const morganStream = { write: (message) => logger.http(message.trim()) };
app.use(morgan('combined', { stream: morganStream }));

// Zero-Trust Tenant Context is now handled inside the authenticate middleware 
// to ensure organizationId is correctly associated with the authenticated user.

// ======================
// Health & Status Check
// ======================
// Root redirect for health is now handled by /api/health
// Production frontend will load on the root path via the catch-all route below.

// ======================
// API Routes (v1)
// ======================
const v1Router = express.Router();

v1Router.get('/health-check', (req, res) => {
    res.json({ success: true, message: 'agpk1-task API v1 is running', timestamp: new Date().toISOString() });
});

v1Router.use('/auth', authRoutes);
v1Router.use('/tasks', taskRoutes);
v1Router.use('/tasks', commentRoutes);
v1Router.use('/tasks', checklistRoutes);
v1Router.use('/views', viewRoutes);
v1Router.use('/workflows', workflowRoutes);
v1Router.use('/automation', automationRoutes);
v1Router.use('/auto-tasks', autoTaskRoutes);
v1Router.use('/approvals', approvalRoutes);
v1Router.use('/projects', projectRoutes);
v1Router.use('/sprints', sprintRoutes);
v1Router.use('/attachments', attachmentRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use('/reports', reportingRoutes);
v1Router.use('/audit', auditRoutes);
v1Router.use('/ai', aiRoutes);
v1Router.use('/health', healthRoutes);
v1Router.use('/work-graph', workGraphRoutes);
v1Router.use('/plugins', pluginRoutes);
v1Router.use('/integrations', integrationRoutes);
v1Router.use('/guest', guestRoutes);
v1Router.use('/docs', docRoutes);
v1Router.use('/custom-fields', customFieldRoutes);
v1Router.use('/okrs', okrRoutes);
v1Router.use('/resource', resourceRoutes);
v1Router.use('/search', globalSearchRoutes);
v1Router.use('/recurring', recurringRoutes);
v1Router.use('/time', timeTrackingRoutes);
v1Router.use('/sla', slaRoutes);
v1Router.use('/operations/export', exportRoutes);
v1Router.use('/standups', standupRoutes);
v1Router.use('/messaging', messagingRoutes);

// Finance Sub-modules
v1Router.use('/finance/invoices', invoiceRoutes);
v1Router.use('/finance/payments', paymentRoutes);
v1Router.use('/finance/ledger', ledgerRoutes);
v1Router.use('/finance/expenses', expenseRoutes);
v1Router.use('/finance/reports', financeReportRoutes);
v1Router.use('/finance/reconciliation', reconciliationRoutes);
v1Router.use('/finance/branches', branchRoutes);
v1Router.use('/finance/accounts', require('./modules/finance/ledger/routes/account.routes'));
v1Router.use('/finance/journal', require('./modules/finance/journal/routes/journal.routes'));
v1Router.use('/finance/compliance', complianceRoutes);
v1Router.use('/finance/budgets', budgetRoutes);
v1Router.use('/finance/payroll', payrollRoutes);
v1Router.use('/finance/recurring', financeRecurringRoutes);
v1Router.use('/finance/credit-notes', require('./modules/finance/invoice/routes/creditNote.routes'));
v1Router.use('/finance/forecasting', require('./modules/finance/forecasting/routes/forecasting.routes'));
v1Router.use('/finance/tax', require('./modules/finance/tax/routes/tax.routes'));


const { tenantContext } = require('./middlewares/tenantContext');

v1Router.use(tenantContext);
app.use('/api/v1', v1Router);

// ======================
// Error Handling
// ======================
// Serve Static Frontend in Production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../public/frontend')));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, '../public/frontend', 'index.html'));
    });
}

const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);

logger.info('✅ App routes and middleware fully initialized.');

module.exports = app;
