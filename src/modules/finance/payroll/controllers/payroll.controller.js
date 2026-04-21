const payrollService = require('../services/payroll.service');
const pdfService = require('../../shared/services/pdf.service');
const catchAsync = require('../../../../utils/catchAsync');
const AppError = require('../../../../utils/appError');
const PayrollRun = require('../models/PayrollRun');
const Payslip = require('../models/Payslip');
const User = require('../../../auth/models/User');
const EmployeeProfile = require('../models/EmployeeProfile');

/**
 * Payroll Controller
 */
exports.generatePayroll = catchAsync(async (req, res, next) => {
    const payrollRun = await payrollService.generatePayrollRun(
        req.body,
        req.user.organizationId,
        req.user._id
    );

    res.status(201).json({
        status: 'success',
        data: payrollRun
    });
});

exports.finalizePayroll = catchAsync(async (req, res, next) => {
    const payrollRun = await payrollService.finalizePayrollRun(
        req.params.id,
        req.user.organizationId
    );

    res.status(200).json({
        status: 'success',
        data: payrollRun
    });
});

exports.getPayrollRuns = catchAsync(async (req, res, next) => {
    const runs = await PayrollRun.find({ organizationId: req.user.organizationId })
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: runs.length,
        data: runs
    });
});

exports.getPayslips = catchAsync(async (req, res, next) => {
    const payslips = await Payslip.find({ 
        payrollRunId: req.params.runId, 
        organizationId: req.user.organizationId 
    }).populate('employeeId', 'name email');

    res.status(200).json({
        status: 'success',
        results: payslips.length,
        data: payslips
    });
});

exports.downloadPayslip = catchAsync(async (req, res, next) => {
    const payslip = await Payslip.findOne({ 
        _id: req.params.id, 
        organizationId: req.user.organizationId 
    });

    if (!payslip) {
        return next(new AppError('Payslip not found', 404));
    }

    const employee = await User.findById(payslip.employeeId);
    const profile = await EmployeeProfile.findById(payslip.employeeProfileId);

    const pdfUrl = await pdfService.generatePayslipPDF(payslip, employee, profile);
    
    // Update payslip with PDF URL (optional, can also just serve)
    payslip.pdfUrl = pdfUrl;
    await payslip.save();

    res.status(200).json({
        status: 'success',
        data: { pdfUrl }
    });
});

exports.downloadSummary = catchAsync(async (req, res, next) => {
    const run = await PayrollRun.findOne({ 
        _id: req.params.id, 
        organizationId: req.user.organizationId 
    });

    if (!run) {
        return next(new AppError('Payroll run not found', 404));
    }

    const payslips = await Payslip.find({ 
        payrollRunId: run._id, 
        organizationId: req.user.organizationId 
    }).populate('employeeId', 'name email');

    // For summary, we might want to get organization details too
    const organization = { name: req.user.organizationName || 'Antigravity Solutions Pvt Ltd' };

    const pdfUrl = await pdfService.generatePayrollSummaryPDF(run, payslips, organization);

    res.status(200).json({
        status: 'success',
        data: { pdfUrl }
    });
});

/**
 * Employee Profile Management
 */
exports.upsertEmployeeProfile = catchAsync(async (req, res, next) => {
    const { userId } = req.body;
    
    let profile = await EmployeeProfile.findOne({ userId, organizationId: req.user.organizationId });
    
    if (profile) {
        profile = await EmployeeProfile.findByIdAndUpdate(profile._id, req.body, {
            new: true,
            runValidators: true
        });
    } else {
        profile = await EmployeeProfile.create({
            ...req.body,
            organizationId: req.user.organizationId
        });
    }

    res.status(200).json({
        status: 'success',
        data: profile
    });
});

exports.getEmployeeProfiles = catchAsync(async (req, res, next) => {
    const profiles = await EmployeeProfile.find({ organizationId: req.user.organizationId })
        .populate('userId', 'name email');

    res.status(200).json({
        status: 'success',
        results: profiles.length,
        data: profiles
    });
});
