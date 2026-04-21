const { Parser } = require('json2csv');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const Task = require('../../work-item/models/Task');
const Invoice = require('../../finance/invoice/models/Invoice');
const Expense = require('../../finance/expenses/models/Expense');
const LedgerEntry = require('../../finance/ledger/models/LedgerEntry');
const { Project } = require('../../project/models/Project');
const TaxConfig = require('../../finance/tax/models/TaxConfig');
const { AppError } = require('../../../core/errors');

class ExportService {
    async getTaskData(filter, organizationId) {
        const tasks = await Task.find({ ...filter, organizationId })
            .populate('assignee', 'name email')
            .populate('project', 'name')
            .sort({ createdAt: -1 });

        return tasks;
    }

    async getInvoiceData(orgId, filters = {}) {
        const query = { organizationId: orgId };
        if (filters.status) query.status = filters.status;
        if (filters.dateFrom || filters.dateTo) {
            query.issueDate = {};
            if (filters.dateFrom) query.issueDate.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.issueDate.$lte = new Date(filters.dateTo);
        }

        return await Invoice.find(query)
            .populate('customer', 'name email')
            .populate('createdBy', 'name')
            .sort({ issueDate: -1 });
    }

    async getExpenseData(orgId, filters = {}) {
        const query = { organizationId: orgId };
        if (filters.status) query.status = filters.status;
        if (filters.category) query.category = filters.category;
        if (filters.dateFrom || filters.dateTo) {
            query.date = {};
            if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
        }

        return await Expense.find(query)
            .populate('vendor', 'name')
            .populate('employeeId', 'firstName lastName')
            .populate('approvedBy', 'firstName lastName')
            .sort({ date: -1 });
    }

    async getJournalData(orgId, filters = {}) {
        const query = { organizationId: orgId, sourceType: 'manual' };
        if (filters.dateFrom || filters.dateTo) {
            query.date = {};
            if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
            if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
        }

        return await LedgerEntry.find(query)
            .populate('entries.accountId', 'code name type')
            .populate('createdBy', 'firstName lastName')
            .sort({ date: -1, createdAt: -1 });
    }

    async getProjectData(orgId, filters = {}) {
        const query = { organizationId: orgId };
        if (filters.status) query.status = filters.status;

        return await Project.find(query)
            .populate('owner', 'firstName lastName')
            .sort({ createdAt: -1 });
    }

    async getTaxData(orgId) {
        return await TaxConfig.find({ organizationId: orgId }).sort({ createdAt: -1 });
    }

    async generateCSV(data) {
        if (!data.length) return '';
        const fields = Object.keys(data[0]);
        const parser = new Parser({ fields });
        return parser.parse(data);
    }

    async generatePDF(data, title = 'Task Export Report') {
        const doc = new jsPDF();

        // Add header
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(title.toUpperCase(), 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        if (data.length > 0) {
            // Simplified data for PDF table
            const tableData = data.map(item => {
                const flat = {};
                Object.keys(item).forEach(k => {
                    if (typeof item[k] !== 'object') flat[k] = item[k];
                });
                return flat;
            });

            if (!tableData.length) return doc.output('arraybuffer');

            const headers = [Object.keys(tableData[0])];
            const body = tableData.map(item => Object.values(item));

            doc.autoTable({
                startY: 40,
                head: headers,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3 },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            });
        } else {
            doc.text('No data available for the selected criteria.', 14, 50);
        }

        return doc.output('arraybuffer');
    }
}

module.exports = new ExportService();

