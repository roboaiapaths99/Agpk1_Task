const invoiceService = require('../services/invoice.service');
const pdfService = require('../../shared/services/pdf.service');
const catchAsync = require('../../../../utils/catchAsync');
const { AppError } = require('../../../../core/errors');
const excelService = require('../../../shared/services/excel.service');
const dunningService = require('../services/dunning.service');

class InvoiceController {
    createInvoice = catchAsync(async (req, res) => {
        const invoice = await invoiceService.createInvoice(req.body, req.user.organizationId, req.user._id);
        res.status(201).json({
            status: 'success',
            data: { invoice }
        });
    });

    getInvoice = catchAsync(async (req, res) => {
        const invoice = await invoiceService.getInvoiceById(req.params.id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { invoice }
        });
    });

    getAllInvoices = catchAsync(async (req, res) => {
        const invoices = await invoiceService.listInvoices(req.query, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            results: invoices.length,
            data: { invoices }
        });
    });

    updateStatus = catchAsync(async (req, res) => {
        const { status } = req.body;
        if (!status) throw new AppError('Status is required', 400);

        const invoice = await invoiceService.updateInvoiceStatus(req.params.id, status, req.user.organizationId, req.user._id);
        res.status(200).json({
            status: 'success',
            data: { invoice }
        });
    });

    updateInvoice = catchAsync(async (req, res) => {
        const invoice = await invoiceService.updateInvoice(req.params.id, req.body, req.user.organizationId, req.user._id);
        res.status(200).json({
            status: 'success',
            data: { invoice }
        });
    });

    deleteInvoice = catchAsync(async (req, res) => {
        await invoiceService.softDeleteInvoice(req.params.id, req.user.organizationId, req.user._id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    restoreInvoice = catchAsync(async (req, res) => {
        const invoice = await invoiceService.restoreInvoice(req.params.id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { invoice }
        });
    });

    downloadInvoice = catchAsync(async (req, res, next) => {
        const invoice = await invoiceService.getInvoiceById(req.params.id, req.user.organizationId);
        
        if (!invoice) {
            return next(new AppError('Invoice not found', 404));
        }

        const organization = { name: 'Your Company Name' }; // Mock or fetch actual organization data

        const pdfUrl = await pdfService.generateInvoicePDF(invoice, organization);
        
        res.status(200).json({
            status: 'success',
            data: { pdfUrl }
        });
    });

    exportInvoices = catchAsync(async (req, res) => {
        const invoices = await invoiceService.listInvoices(req.body, req.user.organizationId);
        const excelUrl = await excelService.generateInvoicesExcel(invoices);
        
        res.status(200).json({
            status: 'success',
            data: { excelUrl }
        });
    });

    triggerDunningCycle = catchAsync(async (req, res) => {
        const results = await dunningService.runDunningCycle();
        res.status(200).json({
            status: 'success',
            data: results
        });
    });
}

module.exports = new InvoiceController();
