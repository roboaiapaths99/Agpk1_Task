const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Models
const Organization = require('../../../auth/models/Organization');
const User = require('../../../auth/models/User');
const Branch = require('../../models/Branch');
const Account = require('../../ledger/models/Account');
const Invoice = require('../../invoice/models/Invoice');
const Expense = require('../../expenses/models/Expense');
const Budget = require('../../budget/models/Budget');
const EmployeeProfile = require('../../payroll/models/EmployeeProfile');
const PayrollRun = require('../../payroll/models/PayrollRun');
const Payslip = require('../../payroll/models/Payslip');
const TimeLog = require('../../../time-tracking/models/TimeLog');
const { Project } = require('../../../project/models/Project'); // Note the destructuring as Project model file exports an object
const Task = require('../../../work-item/models/Task');
const LedgerEntry = require('../../ledger/models/LedgerEntry');

// Services
const accountService = require('../../ledger/services/account.service');

const seedFinancialData = async () => {
    try {
        console.log('🚀 Starting Financial Seeding (Antigravity Solutions Pvt Ltd)...');
        
        // Connect to MongoDB
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/antigravity');
            console.log('✅ Connected to MongoDB');
        }

        // 1. Create Organization
        let org = await Organization.findOne({ domain: 'antigravity.in' });
        if (!org) {
            org = await Organization.create({
                name: 'Antigravity Solutions Pvt Ltd',
                slug: 'antigravity-solutions',
                domain: 'antigravity.in',
                ownerId: new mongoose.Types.ObjectId(), // Placeholder
                currency: 'INR',
                settings: {
                    dateFormat: 'DD/MM/YYYY',
                    fiscalYearStart: 4
                }
            });
            console.log('✅ Created Organization');
        }
        const organizationId = org._id;

        // 2. Create Admin User
        let admin = await User.findOne({ email: 'admin@antigravity.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Antigravity Admin',
                email: 'admin@antigravity.com',
                password: 'Admin@123',
                role: 'admin',
                organizationId,
                isVerified: true
            });
            console.log('✅ Created Admin User');
        }

        // 3. Update Organization Owner
        org.ownerId = admin._id;
        await org.save();

        // 4. Create Project & Task (Required for TimeLogs)
        let project = await Project.findOne({ organizationId, name: 'Internal Operations' });
        if (!project) {
            project = await Project.create({
                name: 'Internal Operations',
                owner: admin._id,
                organizationId,
                status: 'active'
            });
            console.log('✅ Created Project');
        }

        let task = await Task.findOne({ organizationId, title: 'General Administration' });
        if (!task) {
            task = await Task.create({
                title: 'General Administration',
                project: project._id,
                createdBy: admin._id,
                organizationId,
                status: 'in_progress'
            });
            console.log('✅ Created Task');
        }

        // 5. Create Default Branch
        let branch = await Branch.findOne({ organizationId, code: 'HQ' });
        if (!branch) {
            branch = await Branch.create({
                name: 'Main HQ',
                code: 'HQ',
                organizationId,
                address: 'Bangalore, India',
                isMain: true
            });
            console.log('✅ Created Main Branch');
        }
        const branchId = branch._id;

        // 6. Seed Chart of Accounts
        await accountService.seedDefaultAccounts(organizationId);
        console.log('✅ Seeded Chart of Accounts');

        const accounts = await Account.find({ organizationId });
        const bankAcc = accounts.find(a => a.code === '1010');
        const salesAcc = accounts.find(a => a.code === '4000');
        const rentAcc = accounts.find(a => a.code === '5200');

        // 7. Seed Employee Profile
        let empProfile = await EmployeeProfile.findOne({ userId: admin._id });
        if (!empProfile) {
            empProfile = await EmployeeProfile.create({
                userId: admin._id,
                organizationId,
                employeeId: 'EMP-AG-001',
                designation: 'Architect',
                hourlyRate: 3000,
                status: 'active'
            });
            console.log('✅ Created Employee Profile');
        }

        // 8. Seed TimeLogs
        const now = new Date();
        const existingLogs = await TimeLog.countDocuments({ organizationId });
        if (existingLogs < 10) {
            for (let i = 0; i < 20; i++) {
                const logDate = new Date();
                logDate.setDate(now.getDate() - i);
                if (logDate.getDay() === 0 || logDate.getDay() === 6) continue;

                await TimeLog.create({
                    taskId: task._id,
                    userId: admin._id,
                    organizationId,
                    startTime: new Date(new Date(logDate).setHours(9, 0, 0)),
                    endTime: new Date(new Date(logDate).setHours(18, 0, 0)),
                    duration: 540,
                    status: 'completed'
                });
            }
            console.log('✅ Created TimeLogs');
        }

        // 9. Seed Invoices & Ledger Entries (for Health Dashboard)
        const existingInvoices = await Invoice.countDocuments({ organizationId });
        if (existingInvoices === 0) {
            for (let i = 0; i < 6; i++) {
                const invDate = new Date();
                invDate.setMonth(now.getMonth() - i);
                const subtotal = 500000 + (i * 50000);
                const tax = subtotal * 0.18;
                const total = subtotal + tax;

                const inv = await Invoice.create({
                    invoiceNumber: `INV-24-${100 + i}`,
                    organizationId,
                    branchId,
                    customerId: admin._id, // Self-client for simplicity in testing
                    items: [{ description: 'Services', quantity: 1, unitPrice: subtotal, amount: subtotal }],
                    subtotal,
                    taxAmount: tax,
                    totalAmount: total,
                    status: 'paid',
                    issuedDate: invDate,
                    dueDate: invDate
                });

                // Create Ledger Entry for the Invoice
                await LedgerEntry.create({
                    date: invDate,
                    description: `Invoice ${inv.invoiceNumber} Payment`,
                    sourceType: 'invoice',
                    sourceId: inv._id,
                    organizationId,
                    branchId,
                    entries: [
                        { accountId: bankAcc._id, debit: total, credit: 0 },
                        { accountId: salesAcc._id, debit: 0, credit: subtotal }
                    ]
                });
            }
            console.log('✅ Created Invoices & Ledger Entries');
        }

        // 10. Seed Expenses
        const existingExpenses = await Expense.countDocuments({ organizationId });
        if (existingExpenses === 0) {
            for (let i = 0; i < 5; i++) {
                const expDate = new Date();
                expDate.setMonth(now.getMonth() - i);
                const amount = 100000 + (Math.random() * 20000);

                const exp = await Expense.create({
                    category: 'Rent',
                    amount,
                    date: expDate,
                    description: 'Monthly Office Rent',
                    status: 'paid',
                    organizationId,
                    branchId
                });

                // Create Ledger Entry for Expense
                await LedgerEntry.create({
                    date: expDate,
                    description: `Professional Expense: Rent`,
                    sourceType: 'expense',
                    sourceId: exp._id,
                    organizationId,
                    branchId,
                    entries: [
                        { accountId: rentAcc._id, debit: amount, credit: 0 },
                        { accountId: bankAcc._id, debit: 0, credit: amount }
                    ]
                });
            }
            console.log('✅ Created Expenses & Ledger Entries');
        }

        console.log('🎉 Financial Seeding Completed Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedFinancialData();
