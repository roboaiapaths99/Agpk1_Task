import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/useAuth';
import useUIStore from './store/useUI';
import { Toaster } from 'react-hot-toast';
import { BrandingProvider } from './context/BrandingContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TaskBoard from './pages/TaskBoard';
import ProjectTimeline from './pages/ProjectTimeline';
import ApprovalCenter from './pages/ApprovalCenter';
import NotificationPage from './pages/NotificationPage';
import AutomationPage from './pages/AutomationPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Backlog from './pages/Backlog';
import SprintDashboard from './pages/SprintDashboard';
import ModuleHub from './pages/ModuleHub';
import OrganizationPage from './pages/OrganizationPage';
import WorkflowPage from './pages/WorkflowPage';
import IntegrationsPage from './pages/IntegrationsPage';
import ClientPortal from './pages/ClientPortal';
import DocsPage from './pages/DocsPage';
import OKRPage from './pages/OKRPage';
import TableViewPage from './pages/TableViewPage';
import ResourceDashboard from './pages/ResourceDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import NotFoundPage from './pages/NotFoundPage';
import ActivityFeedPage from './pages/ActivityFeedPage';
import RBACPage from './pages/RBACPage';
import SLAPage from './pages/SLAPage';
import ExportCenterPage from './pages/ExportCenterPage';
import WorkGraphPage from './pages/WorkGraphPage';
import TeamPulsePage from './pages/TeamPulsePage';
import InsightsPage from './pages/InsightsPage';
import MessagingPage from './pages/MessagingPage';
import CommandPalette from './services/CommandPalette';

import FinanceDashboard from './modules/finance/dashboard/FinanceDashboard';
import LedgerExplorer from './modules/finance/ledger/LedgerExplorer';
import ComplianceCenter from './modules/finance/compliance/ComplianceCenter';
import AuditTimeline from './modules/finance/audit/AuditTimeline';
import InvoiceList from './modules/finance/invoice/InvoiceList';
import InvoiceForm from './modules/finance/invoice/InvoiceForm';
import ReportHub from './modules/finance/reports/ReportHub';
import ChartOfAccounts from './modules/finance/accounts/ChartOfAccounts';
import AccountForm from './modules/finance/accounts/AccountForm';
import JournalList from './modules/finance/journal/JournalList';
import JournalForm from './modules/finance/journal/JournalForm';
const ExpenseList = React.lazy(() => import('./modules/finance/expense/ExpenseList'));
const ExpenseForm = React.lazy(() => import('./modules/finance/expense/ExpenseForm'));
const ForecastingCenter = React.lazy(() => import('./modules/finance/forecasting/ForecastingCenter'));
const TaxHub = React.lazy(() => import('./modules/finance/tax/TaxHub'));
const BranchList = React.lazy(() => import('./modules/finance/branch/BranchList'));
const BranchForm = React.lazy(() => import('./modules/finance/branch/BranchForm'));
const ReconciliationHub = React.lazy(() => import('./modules/finance/reconciliation/ReconciliationHub'));
const ReconciliationWorkspace = React.lazy(() => import('./modules/finance/reconciliation/ReconciliationWorkspace'));
const BudgetDashboard = React.lazy(() => import('./modules/finance/budget/BudgetDashboard'));
const PayrollDashboard = React.lazy(() => import('./modules/finance/payroll/PayrollDashboard'));
const PayrollRunForm = React.lazy(() => import('./modules/finance/payroll/PayrollRunForm'));
const EmployeeProfiles = React.lazy(() => import('./modules/finance/payroll/EmployeeProfiles'));
const RecurringTransactionsLazy = React.lazy(() => import('./modules/finance/recurring/RecurringTransactions'));
const DunningSettings = React.lazy(() => import('./modules/finance/invoice/DunningSettings'));
const OrgChartPage = React.lazy(() => import('./modules/organization/OrgChartPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function App() {
  const { isAuthenticated, fetchMe } = useAuthStore();
  const { initTheme } = useUIStore();

  React.useEffect(() => {
    initTheme();
    if (isAuthenticated) {
      fetchMe();
    }
  }, [isAuthenticated, fetchMe, initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: '1rem',
              background: '#fff',
              color: '#0f172a',
              fontWeight: 'bold',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              fontSize: '12px'
            },
          }}
        />
        <Router>
          <CommandPalette />
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<EmailVerification />} />
            <Route path="/guest/:token" element={<ClientPortal />} />

            <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
              <Route index element={<ModuleHub />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<TaskBoard />} />
              <Route path="projects" element={<ProjectTimeline />} />
              <Route path="approvals" element={<ApprovalCenter />} />
              <Route path="notifications" element={<NotificationPage />} />
              <Route path="automation" element={<AutomationPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="backlog" element={<Backlog />} />
              <Route path="sprints" element={<SprintDashboard />} />
              <Route path="organization" element={<OrganizationPage />} />
              <Route path="organization/hierarchy" element={<OrgChartPage />} />
              <Route path="workflows" element={<WorkflowPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="docs" element={<DocsPage />} />
              <Route path="okrs" element={<OKRPage />} />
              <Route path="table" element={<TableViewPage />} />
              <Route path="resources" element={<ResourceDashboard />} />
              <Route path="audit" element={<ActivityFeedPage />} />
              <Route path="rbac" element={<RBACPage />} />
              <Route path="sla" element={<SLAPage />} />
              <Route path="export" element={<ExportCenterPage />} />
              <Route path="work-graph" element={<WorkGraphPage />} />
              <Route path="team-pulse" element={<TeamPulsePage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="messaging" element={<MessagingPage />} />

              <Route path="finance">
                <Route index element={<FinanceDashboard />} />
                <Route path="dashboard" element={<FinanceDashboard />} />
                <Route path="ledger" element={<LedgerExplorer />} />
                <Route path="compliance" element={<ComplianceCenter />} />
                <Route path="reconciliation" element={<React.Suspense fallback={null}><ReconciliationHub /></React.Suspense>} />
                <Route path="reconciliation/workspace/:id" element={<React.Suspense fallback={null}><ReconciliationWorkspace /></React.Suspense>} />
                <Route path="invoices" element={<InvoiceList />} />
                <Route path="invoices/new" element={<InvoiceForm />} />
                <Route path="invoices/settings" element={<React.Suspense fallback={null}><DunningSettings /></React.Suspense>} />
                <Route path="invoices/:id" element={<InvoiceForm />} />
                <Route path="expenses" element={<React.Suspense fallback={null}><ExpenseList /></React.Suspense>} />
                <Route path="expenses/new" element={<React.Suspense fallback={null}><ExpenseForm /></React.Suspense>} />
                <Route path="expenses/:id" element={<React.Suspense fallback={null}><ExpenseForm /></React.Suspense>} />
                <Route path="branches" element={<React.Suspense fallback={null}><BranchList /></React.Suspense>} />
                <Route path="branches/new" element={<React.Suspense fallback={null}><BranchForm /></React.Suspense>} />
                <Route path="branches/:id" element={<React.Suspense fallback={null}><BranchForm /></React.Suspense>} />
                <Route path="branches/:id/edit" element={<React.Suspense fallback={null}><BranchForm /></React.Suspense>} />
                <Route path="accounts" element={<ChartOfAccounts />} />
                <Route path="accounts/new" element={<AccountForm />} />
                <Route path="accounts/:id" element={<AccountForm />} />
                <Route path="journal" element={<JournalList />} />
                <Route path="journal/new" element={<JournalForm />} />
                <Route path="journal/:id" element={<JournalForm />} />
                <Route path="reports" element={<ReportHub />} />
                <Route path="recurring" element={<React.Suspense fallback={null}><RecurringTransactionsLazy /></React.Suspense>} />
                <Route path="budgets" element={<React.Suspense fallback={null}><BudgetDashboard /></React.Suspense>} />
                <Route path="payroll" element={<React.Suspense fallback={null}><PayrollDashboard /></React.Suspense>} />
                <Route path="payroll/new" element={<React.Suspense fallback={null}><PayrollRunForm /></React.Suspense>} />
                <Route path="payroll/profiles" element={<React.Suspense fallback={null}><EmployeeProfiles /></React.Suspense>} />
                <Route path="audit" element={<AuditTimeline />} />
                <Route path="forecasting" element={<React.Suspense fallback={null}><ForecastingCenter /></React.Suspense>} />
                <Route path="tax" element={<React.Suspense fallback={null}><TaxHub /></React.Suspense>} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Global 404 for unauthenticated routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
