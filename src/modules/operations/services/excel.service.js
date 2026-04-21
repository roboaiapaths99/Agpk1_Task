const ExcelJS = require('exceljs');
const Invoice = require('../../finance/invoice/models/Invoice');
const Expense = require('../../finance/expenses/models/Expense');
const LedgerEntry = require('../../finance/ledger/models/LedgerEntry');
const { Project } = require('../../project/models/Project');
const Task = require('../../work-item/models/Task');
const logger = require('../../../core/logger');

class ExcelExportService {

    // ─── Style Tokens ───────────────────────────────────────────
    get headerStyle() {
        return {
            font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } },
            alignment: { vertical: 'middle', horizontal: 'center' },
            border: {
                bottom: { style: 'thin', color: { argb: 'FF4338CA' } }
            }
        };
    }

    get currencyFormat() {
        return '₹#,##0.00';
    }

    // ─── INVOICE EXPORT ─────────────────────────────────────────
    async exportInvoices(orgId, filters = {}) {
        const query = { organizationId: orgId };
        if (filters.status) query.status = filters.status;
        if (filters.dateFrom || filters.dateTo) {
            query.issueDate = {};
            if (filters.dateFrom) query.issueDate.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.issueDate.$lte = new Date(filters.dateTo);
        }

        const invoices = await Invoice.find(query)
            .populate('customer', 'name email')
            .populate('createdBy', 'name')
            .sort({ issueDate: -1 })
            .lean();

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AGPK1 Finance System';
        workbook.created = new Date();

        // ── Summary Sheet ──
        const summarySheet = workbook.addWorksheet('Summary', {
            properties: { tabColor: { argb: 'FF4F46E5' } }
        });

        const totalAmount = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
        const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
        const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.totalAmount || 0), 0);
        const totalPending = invoices.filter(i => i.status === 'sent' || i.status === 'draft').reduce((s, i) => s + (i.totalAmount || 0), 0);

        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 25 }
        ];
        this._applyHeaderStyle(summarySheet);

        summarySheet.addRows([
            { metric: 'Report Generated', value: new Date().toLocaleString() },
            { metric: 'Total Invoices', value: invoices.length },
            { metric: 'Total Revenue', value: totalAmount },
            { metric: 'Total Paid', value: totalPaid },
            { metric: 'Total Overdue', value: totalOverdue },
            { metric: 'Total Pending', value: totalPending },
            { metric: 'Collection Rate', value: totalAmount > 0 ? `${((totalPaid / totalAmount) * 100).toFixed(1)}%` : '0%' }
        ]);

        // Format currency cells
        [4, 5, 6, 7].forEach(row => {
            const cell = summarySheet.getCell(`B${row}`);
            cell.numFmt = this.currencyFormat;
        });

        // ── Detail Sheet ──
        const detailSheet = workbook.addWorksheet('Invoices', {
            properties: { tabColor: { argb: 'FF10B981' } }
        });

        detailSheet.columns = [
            { header: 'Invoice #', key: 'invoiceNumber', width: 18 },
            { header: 'Customer', key: 'customer', width: 28 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Issue Date', key: 'issueDate', width: 16 },
            { header: 'Due Date', key: 'dueDate', width: 16 },
            { header: 'Subtotal', key: 'subtotal', width: 16 },
            { header: 'Tax', key: 'tax', width: 14 },
            { header: 'Total', key: 'total', width: 18 },
            { header: 'Amount Paid', key: 'amountPaid', width: 16 },
            { header: 'Balance Due', key: 'balanceDue', width: 16 },
            { header: 'Created By', key: 'createdBy', width: 20 }
        ];
        this._applyHeaderStyle(detailSheet);

        invoices.forEach(inv => {
            const row = detailSheet.addRow({
                invoiceNumber: inv.invoiceNumber || `INV-${inv._id.toString().slice(-6).toUpperCase()}`,
                customer: inv.customer?.name || 'N/A',
                status: (inv.status || 'draft').toUpperCase(),
                issueDate: inv.issueDate ? new Date(inv.issueDate) : null,
                dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
                subtotal: inv.subtotalAmount || 0,
                tax: inv.taxAmount || 0,
                total: inv.totalAmount || 0,
                amountPaid: inv.amountPaid || 0,
                balanceDue: (inv.totalAmount || 0) - (inv.amountPaid || 0),
                createdBy: inv.createdBy?.name || 'System'
            });

            // Apply date format
            if (row.getCell('issueDate').value) row.getCell('issueDate').numFmt = 'yyyy-mm-dd';
            if (row.getCell('dueDate').value) row.getCell('dueDate').numFmt = 'yyyy-mm-dd';

            // Apply currency format
            ['subtotal', 'tax', 'total', 'amountPaid', 'balanceDue'].forEach(key => {
                row.getCell(key).numFmt = this.currencyFormat;
            });

            // Status color coding
            const statusCell = row.getCell('status');
            const statusColors = {
                'PAID': 'FF10B981', 'SENT': 'FF3B82F6', 'OVERDUE': 'FFEF4444',
                'DRAFT': 'FF6B7280', 'CANCELLED': 'FF9CA3AF'
            };
            const color = statusColors[statusCell.value] || 'FF6B7280';
            statusCell.font = { color: { argb: color }, bold: true };
        });

        // Auto-filter
        detailSheet.autoFilter = {
            from: 'A1',
            to: `K${invoices.length + 1}`
        };

        // Freeze header row
        detailSheet.views = [{ state: 'frozen', ySplit: 1 }];

        return workbook;
    }

    // ─── TASK EXPORT ────────────────────────────────────────────
    async exportTasks(orgId, filters = {}) {
        const query = { organizationId: orgId };
        if (filters.projectId) query.project = filters.projectId;
        if (filters.status) query.status = filters.status;
        if (filters.priority) query.priority = filters.priority;

        const tasks = await Task.find(query)
            .populate('assignee', 'name email')
            .populate('project', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AGPK1 Task Manager';
        workbook.created = new Date();

        // ── Summary Sheet ──
        const summarySheet = workbook.addWorksheet('Summary', {
            properties: { tabColor: { argb: 'FF4F46E5' } }
        });

        const statusCounts = {};
        const priorityCounts = {};
        tasks.forEach(t => {
            statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
            priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
        });

        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 25 }
        ];
        this._applyHeaderStyle(summarySheet);

        summarySheet.addRows([
            { metric: 'Report Generated', value: new Date().toLocaleString() },
            { metric: 'Total Tasks', value: tasks.length },
            ...Object.entries(statusCounts).map(([k, v]) => ({ metric: `Status: ${k}`, value: v })),
            ...Object.entries(priorityCounts).map(([k, v]) => ({ metric: `Priority: ${k}`, value: v }))
        ]);

        // ── Detail Sheet ──
        const detailSheet = workbook.addWorksheet('Tasks', {
            properties: { tabColor: { argb: 'FF10B981' } }
        });

        detailSheet.columns = [
            { header: 'Task ID', key: 'taskId', width: 14 },
            { header: 'Title', key: 'title', width: 40 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Priority', key: 'priority', width: 14 },
            { header: 'Project', key: 'project', width: 24 },
            { header: 'Assignee', key: 'assignee', width: 22 },
            { header: 'Created', key: 'created', width: 16 },
            { header: 'Due Date', key: 'dueDate', width: 16 },
            { header: 'SLA Status', key: 'sla', width: 14 }
        ];
        this._applyHeaderStyle(detailSheet);

        tasks.forEach(task => {
            const row = detailSheet.addRow({
                taskId: task.key || task._id.toString().slice(-8).toUpperCase(),
                title: task.title,
                status: (task.status || '').toUpperCase(),
                priority: (task.priority || '').toUpperCase(),
                project: task.project?.name || 'Unassigned',
                assignee: task.assignee?.name || 'Unassigned',
                created: task.createdAt ? new Date(task.createdAt) : null,
                dueDate: task.dueDate ? new Date(task.dueDate) : null,
                sla: task.slaBreached ? 'BREACHED' : (task.slaApplied ? 'ACTIVE' : 'N/A')
            });

            if (row.getCell('created').value) row.getCell('created').numFmt = 'yyyy-mm-dd';
            if (row.getCell('dueDate').value) row.getCell('dueDate').numFmt = 'yyyy-mm-dd';

            // Priority color coding
            const priorityCell = row.getCell('priority');
            const priorityColors = {
                'CRITICAL': 'FFEF4444', 'HIGH': 'FFF59E0B', 'MEDIUM': 'FF3B82F6', 'LOW': 'FF10B981'
            };
            priorityCell.font = { color: { argb: priorityColors[priorityCell.value] || 'FF6B7280' }, bold: true };
        });

        detailSheet.autoFilter = { from: 'A1', to: `I${tasks.length + 1}` };
        detailSheet.views = [{ state: 'frozen', ySplit: 1 }];

        return workbook;
    }

    // ─── EXPENSE EXPORT ─────────────────────────────────────────
    async exportExpenses(orgId, filters = {}) {
        const query = { organizationId: orgId };
        if (filters.status) query.status = filters.status;
        if (filters.category) query.category = filters.category;
        if (filters.dateFrom || filters.dateTo) {
            query.date = {};
            if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
        }

        const expenses = await Expense.find(query)
            .populate('vendor', 'name')
            .populate('employeeId', 'firstName lastName')
            .populate('approvedBy', 'firstName lastName')
            .sort({ date: -1 })
            .lean();

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AGPK1 Finance System';
        
        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Summary');
        const catTotals = {};
        expenses.forEach(e => {
            catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
        });

        summarySheet.columns = [
            { header: 'Category', key: 'cat', width: 25 },
            { header: 'Total Amount', key: 'amount', width: 20 }
        ];
        this._applyHeaderStyle(summarySheet);
        
        Object.entries(catTotals).forEach(([cat, amount]) => {
            const row = summarySheet.addRow({ cat: cat.toUpperCase(), amount });
            row.getCell('amount').numFmt = this.currencyFormat;
        });

        // Detail Sheet
        const detailSheet = workbook.addWorksheet('Expenses');
        detailSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'desc', width: 35 },
            { header: 'Category', key: 'category', width: 18 },
            { header: 'Vendor', key: 'vendor', width: 22 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Employee', key: 'emp', width: 20 },
            { header: 'Approved By', key: 'approver', width: 20 }
        ];
        this._applyHeaderStyle(detailSheet);

        expenses.forEach(exp => {
            const row = detailSheet.addRow({
                date: exp.date,
                desc: exp.description,
                category: exp.category,
                vendor: exp.vendor?.name || exp.merchant || 'N/A',
                amount: exp.amount,
                status: exp.status.toUpperCase(),
                emp: exp.employeeId ? `${exp.employeeId.firstName} ${exp.employeeId.lastName}` : 'N/A',
                approver: exp.approvedBy ? `${exp.approvedBy.firstName} ${exp.approvedBy.lastName}` : 'N/A'
            });
            row.getCell('date').numFmt = 'yyyy-mm-dd';
            row.getCell('amount').numFmt = this.currencyFormat;
        });

        return workbook;
    }

    // ─── JOURNAL EXPORT ─────────────────────────────────────────
    async exportJournalEntries(orgId, filters = {}) {
        const query = { organizationId: orgId, sourceType: 'manual' };
        if (filters.dateFrom || filters.dateTo) {
            query.date = {};
            if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
        }

        const journals = await LedgerEntry.find(query)
            .populate('entries.accountId', 'code name type')
            .populate('createdBy', 'firstName lastName')
            .sort({ date: -1, createdAt: -1 })
            .lean();

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('General Journal');
        
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'desc', width: 40 },
            { header: 'Account', key: 'account', width: 30 },
            { header: 'Debit', key: 'debit', width: 15 },
            { header: 'Credit', key: 'credit', width: 15 },
            { header: 'Posted By', key: 'user', width: 20 }
        ];
        this._applyHeaderStyle(sheet);

        journals.forEach(journal => {
            journal.entries.forEach((entry, idx) => {
                const row = sheet.addRow({
                    date: idx === 0 ? journal.date : null,
                    desc: idx === 0 ? journal.description : null,
                    account: `[${entry.accountId?.code || '??'}] ${entry.accountId?.name || 'Unknown'}`,
                    debit: entry.debit || 0,
                    credit: entry.credit || 0,
                    user: idx === 0 ? (journal.createdBy ? `${journal.createdBy.firstName} ${journal.createdBy.lastName}` : 'System') : null
                });
                
                if (idx === 0) row.getCell('date').numFmt = 'yyyy-mm-dd';
                row.getCell('debit').numFmt = this.currencyFormat;
                row.getCell('credit').numFmt = this.currencyFormat;

                // Add bottom border to the last entry of a journal group
                if (idx === journal.entries.length - 1) {
                    row.eachCell(cell => {
                        cell.border = { ...cell.border, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
                    });
                }
            });
        });

        return workbook;
    }

    // ─── PROJECT EXPORT ──────────────────────────────────────────
    async exportProjects(orgId, filters = {}) {
        const query = { organizationId: orgId };
        if (filters.status) query.status = filters.status;

        const projects = await Project.find(query)
            .populate('owner', 'firstName lastName')
            .sort({ createdAt: -1 })
            .lean();

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Projects Overview');

        sheet.columns = [
            { header: 'Project Name', key: 'name', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Progress', key: 'progress', width: 12 },
            { header: 'Start Date', key: 'start', width: 15 },
            { header: 'End Date', key: 'end', width: 15 },
            { header: 'Owner', key: 'owner', width: 25 },
            { header: 'Business Unit', key: 'unit', width: 20 }
        ];
        this._applyHeaderStyle(sheet);

        projects.forEach(p => {
            const row = sheet.addRow({
                name: p.name,
                status: (p.status || 'planning').toUpperCase(),
                progress: (p.progress || 0) / 100,
                start: p.startDate,
                end: p.endDate,
                owner: p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : 'N/A',
                unit: p.metadata?.businessUnit || 'N/A'
            });

            row.getCell('progress').numFmt = '0%';
            row.getCell('start').numFmt = 'yyyy-mm-dd';
            row.getCell('end').numFmt = 'yyyy-mm-dd';

            // Status color
            const statusCell = row.getCell('status');
            const colors = { 'COMPLETED': 'FF10B981', 'ACTIVE': 'FF3B82F6', 'ON_HOLD': 'FFF59E0B', 'CANCELLED': 'FFEF4444' };
            statusCell.font = { color: { argb: colors[statusCell.value] || 'FF6B7280' }, bold: true };
        });

        return workbook;
    }

    // ─── Helpers ─────────────────────────────────────────────────
    _applyHeaderStyle(sheet) {
        const headerRow = sheet.getRow(1);
        headerRow.eachCell(cell => {
            Object.assign(cell, {
                font: this.headerStyle.font,
                fill: this.headerStyle.fill,
                alignment: this.headerStyle.alignment,
                border: this.headerStyle.border
            });
        });
        headerRow.height = 28;
    }
}

module.exports = new ExcelExportService();
