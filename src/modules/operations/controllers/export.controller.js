const exportService = require('../services/export.service');
const excelService = require('../../shared/services/excel.service');

class ExportController {
    async exportTasks(req, res, next) {
        try {
            const { format, ...filters } = req.query;
            const data = await exportService.getTaskData(filters, req.user.organizationId);

            if (!data.length && format) {
                return res.status(404).json({ message: 'No data found for the given criteria' });
            }

            if (format === 'csv') {
                const csv = await exportService.generateCSV(data);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=export_${Date.now()}.csv`);
                return res.send(csv);
            }

            if (format === 'pdf') {
                const pdfBuffer = await exportService.generatePDF(data);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=export_${Date.now()}.pdf`);
                return res.send(Buffer.from(pdfBuffer));
            }

            return res.json({ success: true, data, message: 'Data retrieved successfully' });
        } catch (error) {
            next(error);
        }
    }

    // ─── Excel Export: Invoices ──────────────────────────────────
    async exportInvoicesExcel(req, res, next) {
        try {
            const data = await exportService.getInvoiceData(req.user.organizationId, req.query);
            const workbook = await excelService.exportInvoicesWorkbook(data);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Invoices_${Date.now()}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    }

    // ─── Excel Export: Tasks ────────────────────────────────────
    async exportTasksExcel(req, res, next) {
        try {
            const data = await exportService.getTaskData(req.query, req.user.organizationId);
            const workbook = await excelService.exportTasksWorkbook(data);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Tasks_${Date.now()}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    }

    // ─── Excel Export: Expenses ──────────────────────────────────
    async exportExpensesExcel(req, res, next) {
        try {
            const data = await exportService.getExpenseData(req.user.organizationId, req.query);
            const workbook = await excelService.exportExpensesWorkbook(data);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Expenses_${Date.now()}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    }

    // ─── Excel Export: Journal ──────────────────────────────────
    async exportJournalExcel(req, res, next) {
        try {
            const data = await exportService.getJournalData(req.user.organizationId, req.query);
            const workbook = await excelService.exportJournalWorkbook(data);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Journal_${Date.now()}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    }

    // ─── Excel Export: Projects ──────────────────────────────────
    async exportProjectsExcel(req, res, next) {
        try {
            const data = await exportService.getProjectData(req.user.organizationId, req.query);
            const workbook = await excelService.exportProjectsWorkbook(data);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Projects_${Date.now()}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    }

    // ─── Excel Export: Tax Configs ─────────────────────────────
    async exportTaxExcel(req, res, next) {
        try {
            const data = await exportService.getTaxData(req.user.organizationId);
            const workbook = await excelService.exportTaxWorkbook(data);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Tax_Configs_${Date.now()}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ExportController();

