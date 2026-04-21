const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ExcelService {
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

    // ─── Helper Methods ─────────────────────────────────────────
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

    async _saveWorkbook(workbook, baseName) {
        const fileName = `${baseName.toLowerCase().replace(/\s+/g, '_')}_export_${uuidv4().split('-')[0]}.xlsx`;
        const dirPath = path.join(process.cwd(), 'public/temp/excels');
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

        const filePath = path.join(dirPath, fileName);
        await workbook.xlsx.writeFile(filePath);

        return `/temp/excels/${fileName}`;
    }

    // ─── INVOICE EXPORT ─────────────────────────────────────────
    async exportInvoicesWorkbook(invoices) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AGPK1 Finance System';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Invoices', { properties: { tabColor: { argb: 'FF4F46E5' } } });
        
        sheet.columns = [
            { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
            { header: 'Customer Name', key: 'customerName', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Issue Date', key: 'issuedDate', width: 15 },
            { header: 'Due Date', key: 'dueDate', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Balance Due', key: 'balanceDue', width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        invoices.forEach(inv => {
            const row = sheet.addRow({
                invoiceNumber: inv.invoiceNumber,
                customerName: inv.customerId?.name || inv.customer?.name || 'N/A',
                status: (inv.status || 'draft').toUpperCase(),
                issuedDate: inv.issuedDate ? new Date(inv.issuedDate) : null,
                dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
                totalAmount: inv.totalAmount || 0,
                balanceDue: (inv.totalAmount || 0) - (inv.amountPaid || 0)
            });

            if (row.getCell('issuedDate').value) row.getCell('issuedDate').numFmt = 'yyyy-mm-dd';
            if (row.getCell('dueDate').value) row.getCell('dueDate').numFmt = 'yyyy-mm-dd';
            row.getCell('totalAmount').numFmt = this.currencyFormat;
            row.getCell('balanceDue').numFmt = this.currencyFormat;
        });

        return workbook;
    }

    async generateInvoicesExcel(invoices) {
        const workbook = await this.exportInvoicesWorkbook(invoices);
        return this._saveWorkbook(workbook, 'invoices');
    }

    // ─── EXPENSE EXPORT ─────────────────────────────────────────
    async exportExpensesWorkbook(expenses) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Expenses');

        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Vendor', key: 'vendorName', width: 25 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        expenses.forEach(exp => {
            const row = sheet.addRow({
                date: exp.date ? new Date(exp.date) : null,
                category: exp.categoryId?.name || exp.category || 'N/A',
                amount: exp.amount,
                vendorName: exp.vendor?.name || exp.vendorName || 'N/A',
                description: exp.description || '',
                status: (exp.status || 'pending').toUpperCase()
            });
            if (row.getCell('date').value) row.getCell('date').numFmt = 'yyyy-mm-dd';
            row.getCell('amount').numFmt = this.currencyFormat;
        });

        return workbook;
    }

    async generateExpensesExcel(expenses) {
        const workbook = await this.exportExpensesWorkbook(expenses);
        return this._saveWorkbook(workbook, 'expenses');
    }

    // ─── TASK EXPORT ────────────────────────────────────────────
    async exportTasksWorkbook(tasks) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Tasks');

        sheet.columns = [
            { header: 'Task ID', key: 'taskId', width: 15 },
            { header: 'Title', key: 'title', width: 40 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Priority', key: 'priority', width: 15 },
            { header: 'Project', key: 'project', width: 25 },
            { header: 'Assignee', key: 'assignee', width: 25 },
            { header: 'Due Date', key: 'dueDate', width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        tasks.forEach(task => {
            const row = sheet.addRow({
                taskId: task.key || task._id?.toString().slice(-8).toUpperCase() || 'N/A',
                title: task.title,
                status: (task.status || '').toUpperCase(),
                priority: (task.priority || '').toUpperCase(),
                project: task.project?.name || 'Unassigned',
                assignee: task.assignee?.name || task.assignee?.firstName || 'Unassigned',
                dueDate: task.dueDate ? new Date(task.dueDate) : null
            });
            if (row.getCell('dueDate').value) row.getCell('dueDate').numFmt = 'yyyy-mm-dd';
        });

        return workbook;
    }

    // ─── JOURNAL EXPORT ─────────────────────────────────────────
    async exportJournalWorkbook(journals) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('General Journal');
        
        sheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Description', key: 'desc', width: 40 },
            { header: 'Account', key: 'account', width: 30 },
            { header: 'Debit', key: 'debit', width: 15 },
            { header: 'Credit', key: 'credit', width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        journals.forEach(journal => {
            const entries = journal.entries || [];
            entries.forEach((entry, idx) => {
                const row = sheet.addRow({
                    date: idx === 0 ? (journal.date ? new Date(journal.date) : null) : null,
                    desc: idx === 0 ? journal.description : null,
                    account: `[${entry.accountId?.code || '??'}] ${entry.accountId?.name || 'Unknown'}`,
                    debit: entry.debit || 0,
                    credit: entry.credit || 0
                });
                
                if (idx === 0 && row.getCell('date').value) row.getCell('date').numFmt = 'yyyy-mm-dd';
                row.getCell('debit').numFmt = this.currencyFormat;
                row.getCell('credit').numFmt = this.currencyFormat;
            });
        });

        return workbook;
    }

    // ─── PROJECTS EXPORT ─────────────────────────────────────────
    async exportProjectsWorkbook(projects) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Projects Overview');

        sheet.columns = [
            { header: 'Project Name', key: 'name', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Progress', key: 'progress', width: 12 },
            { header: 'Start Date', key: 'start', width: 15 },
            { header: 'End Date', key: 'end', width: 15 },
            { header: 'Owner', key: 'owner', width: 25 }
        ];

        this._applyHeaderStyle(sheet);

        projects.forEach(p => {
            const row = sheet.addRow({
                name: p.name,
                status: (p.status || 'planning').toUpperCase(),
                progress: (p.progress || 0) / 100,
                start: p.startDate ? new Date(p.startDate) : null,
                end: p.endDate ? new Date(p.endDate) : null,
                owner: p.owner ? `${p.owner.firstName || ''} ${p.owner.lastName || ''}`.trim() || p.owner.name : 'N/A'
            });

            row.getCell('progress').numFmt = '0%';
            if (row.getCell('start').value) row.getCell('start').numFmt = 'yyyy-mm-dd';
            if (row.getCell('end').value) row.getCell('end').numFmt = 'yyyy-mm-dd';
        });

        return workbook;
    }

    // ─── Excel Export: Tax Configs ─────────────────────────────
    async exportTaxWorkbook(taxes) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Tax Configurations');

        sheet.columns = [
            { header: 'Tax Name', key: 'name', width: 25 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Rate (%)', key: 'rate', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Default', key: 'isDefault', width: 12 },
            { header: 'Description', key: 'description', width: 40 }
        ];

        this._applyHeaderStyle(sheet);

        taxes.forEach(t => {
            const row = sheet.addRow({
                name: t.name || 'N/A',
                type: t.type ? t.type.toUpperCase() : 'N/A',
                rate: (t.rate || 0) / 100,
                status: t.isActive ? 'Active' : 'Inactive',
                isDefault: t.isDefault ? 'Yes' : 'No',
                description: t.description || 'N/A'
            });

            row.getCell('rate').numFmt = '0.00%';
        });

        return workbook;
    }

    // ─── GENERIC EXPORT (Used by Reports) ───────────────────────
    async generateGenericExcel(title, headers, rowData) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(title);

        sheet.columns = headers.map(h => ({ header: h.label, key: h.key, width: h.width || 20 }));

        this._applyHeaderStyle(sheet);

        rowData.forEach(row => {
            const newRow = sheet.addRow(row);
            // Auto-format currency for 'amount' key if present
            if (row.amount !== undefined) {
                newRow.getCell('amount').numFmt = this.currencyFormat;
            }
        });

        return this._saveWorkbook(workbook, title);
    }
}

module.exports = new ExcelService();

