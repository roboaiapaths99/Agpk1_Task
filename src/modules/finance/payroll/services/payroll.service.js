const PayrollRun = require('../models/PayrollRun');
const Payslip = require('../models/Payslip');
const EmployeeProfile = require('../models/EmployeeProfile');
const TimeLog = require('../../../time-tracking/models/TimeLog');
const eventBus = require('../../../../core/eventBus');
const catchAsync = require('../../../../utils/catchAsync');
const AppError = require('../../../../utils/appError');

/**
 * Payroll Service
 * Handles dynamic payroll calculation based on time tracking data.
 */
class PayrollService {
    /**
     * Generate a new payroll run for a specific period
     */
    async generatePayrollRun(data, organizationId, processedBy) {
        const { name, periodStart, periodEnd } = data;

        // 1. Create the Payroll Run record (Draft)
        const payrollRun = await PayrollRun.create({
            name,
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            organizationId,
            processedBy,
            status: 'draft'
        });

        // 2. Fetch all active employee profiles in the organization
        const activeProfiles = await EmployeeProfile.find({
            organizationId,
            status: 'active'
        }).populate('userId');

        let totalGross = 0;
        let totalNet = 0;
        let employeeCount = 0;

        // 3. Process each employee
        for (const profile of activeProfiles) {
            // Aggregate TimeLogs for this employee in the period
            const timeLogs = await TimeLog.aggregate([
                {
                    $match: {
                        userId: profile.userId._id,
                        organizationId,
                        status: 'completed',
                        startTime: { $gte: new Date(periodStart), $lte: new Date(periodEnd) }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalMinutes: { $sum: '$duration' }
                    }
                }
            ]);

            const totalMinutes = timeLogs.length > 0 ? timeLogs[0].totalMinutes : 0;
            const totalHours = totalMinutes / 60;
            
            // Basic Calculation: Hours * Rate
            const basicSalary = totalHours * profile.hourlyRate;
            
            // Tax Calculation (Simplified for now - can be expanded)
            const taxDeduction = basicSalary * 0.10; // 10% Flat tax
            const insuranceDeduction = basicSalary * 0.02; // 2% Insurance
            
            const grossSalary = basicSalary; // Can add bonuses/overtime later
            const netSalary = grossSalary - taxDeduction - insuranceDeduction;

            // 4. Create individual Payslip
            await Payslip.create({
                payrollRunId: payrollRun._id,
                employeeId: profile.userId._id,
                employeeProfileId: profile._id,
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
                totalHours,
                hourlyRate: profile.hourlyRate,
                basicSalary,
                taxDeduction,
                insuranceDeduction,
                grossSalary,
                netSalary,
                organizationId,
                status: 'draft'
            });

            totalGross += grossSalary;
            totalNet += netSalary;
            employeeCount++;
        }

        // 5. Update Payroll Run with totals
        payrollRun.totalGross = totalGross;
        payrollRun.totalNet = totalNet;
        payrollRun.employeeCount = employeeCount;
        await payrollRun.save();

        return payrollRun;
    }

    /**
     * Finalize payroll run and trigger financial entries
     */
    async finalizePayrollRun(payrollRunId, organizationId) {
        const payrollRun = await PayrollRun.findOne({ _id: payrollRunId, organizationId });
        
        if (!payrollRun) {
            throw new AppError('Payroll run not found', 404);
        }

        if (payrollRun.status !== 'draft') {
            throw new AppError('Payroll run is already processed or paid', 400);
        }

        payrollRun.status = 'processed';
        await payrollRun.save();

        // Update all associated payslips to 'generated'
        await Payslip.updateMany(
            { payrollRunId, organizationId },
            { status: 'generated' }
        );

        // Trigger Event for Finance Subscriber (to create expenses/ledger entries)
        eventBus.emit('HR_PAYROLL_PROCESSED', {
            payrollRunId: payrollRun._id,
            totalNet: payrollRun.totalNet,
            totalGross: payrollRun.totalGross,
            organizationId,
            periodEnd: payrollRun.periodEnd
        });

        return payrollRun;
    }

    /**
     * Get Payslips for an employee
     */
    async getEmployeePayslips(userId, organizationId) {
        return await Payslip.find({ employeeId: userId, organizationId })
            .populate('payrollRunId')
            .sort({ periodEnd: -1 });
    }
}

module.exports = new PayrollService();
