const reportService = require('../services/report.service');
const agingService = require('../services/aging.service');
const catchAsync = require('../../../../utils/catchAsync');
const pdfService = require('../../shared/services/pdf.service');
const Organization = require('../../../auth/models/Organization');
const emailService = require('../../../auth/services/email.service');
const excelService = require('../../../shared/services/excel.service');
const forecastingService = require('../services/forecasting.service');
const path = require('path');
const fs = require('fs');
const AuditLog = require('../../../audit/models/AuditLog');
const User = require('../../../auth/models/User');

class ReportController {
    _calculateDates(startDate, endDate, timeframe) {
        if (timeframe && !startDate) {
            const now = new Date();
            endDate = now;
            if (timeframe === 'mtd') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            else if (timeframe === 'qtd') startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            else if (timeframe === 'ytd') startDate = new Date(now.getFullYear(), 0, 1);
            else if (timeframe === 'last_fy') {
                const year = now.getFullYear();
                startDate = new Date(year - 1, 3, 1); // April-March FY
                endDate = new Date(year, 2, 31);
            }
        }
        return { 
            startDate: startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)), 
            endDate: endDate || new Date() 
        };
    }

    getPLReport = catchAsync(async (req, res) => {
        let { startDate, endDate, timeframe, branchId } = req.query;
        const dates = this._calculateDates(startDate, endDate, timeframe);

        const report = await reportService.getProfitAndLoss(
            dates.startDate,
            dates.endDate,
            req.user.organizationId,
            branchId
        );
        res.status(200).json({
            status: 'success',
            data: report
        });
    });

    getDashboard = catchAsync(async (req, res) => {
        const { branchId } = req.query;
        const dashboardService = require('../services/dashboard.service');
        const summary = await dashboardService.getBusinessHealthSummary(req.user.organizationId, branchId);
        res.status(200).json({
            status: 'success',
            data: summary
        });
    });

    getRevenueBreakdown = catchAsync(async (req, res) => {
        const { branchId } = req.query;
        const breakdown = await reportService.getRevenueByProject(req.user.organizationId, branchId);
        res.status(200).json({
            status: 'success',
            data: { breakdown }
        });
    });

    getBalanceSheet = catchAsync(async (req, res) => {
        const { branchId } = req.query;
        const sheet = await reportService.getBalanceSheet(req.user.organizationId, branchId);
        res.status(200).json({
            status: 'success',
            data: sheet
        });
    });

    getCashFlow = catchAsync(async (req, res) => {
        const { branchId } = req.query;
        const cashFlow = await reportService.getCashFlow(req.user.organizationId, branchId);
        res.status(200).json({
            status: 'success',
            data: cashFlow
        });
    });

    getARAging = catchAsync(async (req, res) => {
        const { branchId, customerId, asOfDate } = req.query;
        const report = await agingService.getReceivableAging(req.user.organizationId, { branchId, customerId, asOfDate });
        res.status(200).json({
            status: 'success',
            data: report
        });
    });

    getAPAging = catchAsync(async (req, res) => {
        const { branchId, asOfDate } = req.query;
        const report = await agingService.getPayableAging(req.user.organizationId, { branchId, asOfDate });
        res.status(200).json({
            status: 'success',
            data: report
        });
    });

    getDunningList = catchAsync(async (req, res) => {
        const { branchId } = req.query;
        const list = await agingService.getDunningList(req.user.organizationId, { branchId });
        res.status(200).json({
            status: 'success',
            data: list
        });
    });

    getForecasting = catchAsync(async (req, res) => {
        const { branchId } = req.query;
        const forecast = await forecastingService.predictRevenueAndCashFlow(req.user.organizationId, branchId);
        res.status(200).json({
            status: 'success',
            data: forecast
        });
    });

    exportReport = catchAsync(async (req, res) => {
        const { type, startDate: sDate, endDate: eDate, timeframe, branchId } = req.body;
        const { startDate, endDate } = this._calculateDates(sDate, eDate, timeframe);

        // 1. Get Report Data
        let reportData;
        if (type === 'profit_and_loss') {
            reportData = await reportService.getProfitAndLoss(startDate, endDate, req.user.organizationId, branchId);
        } else if (type === 'balance_sheet') {
            reportData = await reportService.getBalanceSheet(req.user.organizationId, branchId);
        } else if (type === 'cashflow') {
            reportData = await reportService.getCashFlow(req.user.organizationId, branchId);
        }

        const org = await Organization.findById(req.user.organizationId);

        // 2. Generate PDF
        const pdfUrl = await pdfService.generateGenericReportPDF(type, reportData, org);

        res.status(200).json({
            status: 'success',
            data: { pdfUrl }
        });
    });

    exportExcel = catchAsync(async (req, res) => {
        const { type, startDate: sDate, endDate: eDate, timeframe, branchId } = req.body;
        const { startDate, endDate } = this._calculateDates(sDate, eDate, timeframe);

        let reportData;
        let headers = [];
        let rows = [];
        let title = type.toUpperCase().replace('_', ' ');

        if (type === 'profit_and_loss') {
            reportData = await reportService.getProfitAndLoss(startDate, endDate, req.user.organizationId, branchId);
            headers = [{ label: 'Category', key: 'category' }, { label: 'Amount', key: 'amount' }, { label: 'Type', key: 'type' }];
            reportData.revenue.forEach(r => rows.push({ category: r.category, amount: r.amount, type: 'Revenue' }));
            reportData.expenses.forEach(e => rows.push({ category: e.category, amount: e.amount, type: 'Expense' }));
            rows.push({ category: 'NET PROFIT', amount: reportData.netProfit, type: 'Summary' });
        } else if (type === 'balance_sheet') {
            reportData = await reportService.getBalanceSheet(req.user.organizationId, branchId);
            headers = [{ label: 'Name', key: 'name' }, { label: 'Amount', key: 'amount' }, { label: 'Type', key: 'type' }];
            reportData.assets.forEach(a => rows.push({ name: a.name, amount: a.amount, type: 'Asset' }));
            reportData.liabilities.forEach(l => rows.push({ name: l.name, amount: l.amount, type: 'Liability' }));
            reportData.equity.forEach(e => rows.push({ name: e.name, amount: e.amount, type: 'Equity' }));
        } else if (type === 'cashflow') {
            reportData = await reportService.getCashFlow(req.user.organizationId, branchId);
            headers = [{ label: 'Period', key: 'period' }, { label: 'Inflow', key: 'inflow' }, { label: 'Outflow', key: 'outflow' }, { label: 'Net', key: 'net' }];
            reportData.data.forEach(d => rows.push({ period: d.period, inflow: d.inflow, outflow: d.outflow, net: d.net }));
        }

        const excelUrl = await excelService.generateGenericExcel(title, headers, rows);

        res.status(200).json({
            status: 'success',
            data: { excelUrl }
        });
    });

    distributeReport = catchAsync(async (req, res) => {
        const { type, recipients, startDate: sDate, endDate: eDate, timeframe, branchId } = req.body;
        const { startDate, endDate } = this._calculateDates(sDate, eDate, timeframe);
        
        // 1. Get Report Data (similar to export)
        let reportData;
        if (type === 'profit_and_loss') {
            reportData = await reportService.getProfitAndLoss(startDate, endDate, req.user.organizationId, branchId);
        } else if (type === 'balance_sheet') {
            reportData = await reportService.getBalanceSheet(req.user.organizationId, branchId);
        } else if (type === 'cashflow') {
            reportData = await reportService.getCashFlow(req.user.organizationId, branchId);
        }

        const org = await Organization.findById(req.user.organizationId);
        const userEmail = req.user.email;
        const targetEmails = recipients || [org.email || userEmail];

        // 2. Generate PDF
        const pdfUrl = await pdfService.generateGenericReportPDF(type, reportData, org);
        const absolutePath = path.join(process.cwd(), 'public', pdfUrl.slice(1));

        // 3. Queue Email Distribution
        const subject = `Financial Report: ${type.toUpperCase().replace('_', ' ')} - ${org.name}`;
        const html = `
            <h3>Financial Report Distribution</h3>
            <p>Please find the requested <b>${type.replace('_', ' ')}</b> report for <b>${org.name}</b> attached to this email.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <br/>
            <p>Best Regards,<br/>AGPK1-Task Finance System</p>
        `;

        await emailService.sendFinancialReport(
            targetEmails, 
            subject, 
            html, 
            [{
                filename: `${type}_report.pdf`,
                path: absolutePath
            }]
        );

        res.status(200).json({
            status: 'success',
            message: `Report distribution queued for ${targetEmails.join(', ')}.`
        });
    });

    recordDunningAction = catchAsync(async (req, res) => {
        const { customerId, actionType, notes, totalOverdue, oldestInvoiceDays } = req.body;

        // 1. Record Action in Audit Log
        await AuditLog.create({
            userId: req.user._id,
            organizationId: req.user.organizationId,
            action: 'DUNNING_ACTION',
            module: 'FINANCE',
            entityType: 'Customer',
            entityId: customerId,
            newData: {
                actionType,
                notes,
                automated: false,
                totalOverdue,
                oldestInvoiceDays
            }
        });

        // 2. Trigger Real Notifications if Email
        if (actionType === 'Email') {
            const customer = await User.findById(customerId);
            if (customer && customer.email) {
                await emailService.sendDunningEmail(
                    customer.email,
                    customer.name || 'Valued Customer',
                    totalOverdue,
                    oldestInvoiceDays
                );
            }
        }

        res.status(200).json({
            status: 'success',
            message: `Manual ${actionType} action recorded for customer.`
        });
    });

    getDunningHistory = catchAsync(async (req, res) => {
        const { branchId, customerId } = req.query;
        
        const query = {
            organizationId: req.user.organizationId,
            action: 'DUNNING_ACTION'
        };

        if (customerId) query.entityId = customerId;

        const history = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('userId', 'name');

        res.status(200).json({
            status: 'success',
            data: history
        });
    });
}

module.exports = new ReportController();
