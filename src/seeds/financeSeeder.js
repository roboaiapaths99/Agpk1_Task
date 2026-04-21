const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const User = require('../modules/auth/models/User');
const Organization = require('../modules/auth/models/Organization');
const Account = require('../modules/finance/ledger/models/Account');
const LedgerEntry = require('../modules/finance/ledger/models/LedgerEntry');
const Invoice = require('../modules/finance/invoice/models/Invoice');
const EmployeeProfile = require('../modules/finance/payroll/models/EmployeeProfile');
const PayrollRun = require('../modules/finance/payroll/models/PayrollRun');
const Payslip = require('../modules/finance/payroll/models/Payslip');
const Expense = require('../modules/finance/expenses/models/Expense');
const Budget = require('../modules/finance/budget/models/Budget');
const logger = require('../core/logger');

const seedFinance = async () => {
    try {
        await connectDB();
        logger.info('DB Connected for Finance Seeding...');

        // 1. Create Organization
        const orgName = 'Antigravity Solutions Pvt Ltd';
        const orgSlug = 'antigravity-solutions';
        
        let org = await Organization.findOne({ slug: orgSlug });
        if (!org) {
            org = await Organization.create({
                name: orgName,
                domain: 'antigravity.io',
                slug: orgSlug,
                settings: {
                    maxUsers: 50,
                    features: ['finance', 'payroll', 'projects']
                }
            });
            logger.info(`Created Organization: ${orgName}`);
        }

        const orgId = org._id;

        // 2. Create Accounts if they don't exist
        const accountsToCreate = [
            { name: 'Main Operating Account', code: '1000', type: 'asset', balance: 2500000 },
            { name: 'Accounts Receivable', code: '1200', type: 'asset', balance: 0 },
            { name: 'Revenue - Services', code: '4000', type: 'revenue', balance: 0 },
            { name: 'Payroll Expense', code: '5100', type: 'expense', balance: 0 },
            { name: 'Retained Earnings', code: '3000', type: 'equity', balance: 2500000 }
        ];

        const accounts = {};
        for (const acc of accountsToCreate) {
            let existingAcc = await Account.findOne({ code: acc.code, organizationId: orgId });
            if (!existingAcc) {
                existingAcc = await Account.create({ ...acc, organizationId: orgId, isSystem: true });
            }
            accounts[acc.code] = existingAcc;
        }
        logger.info('Finance Accounts verified/created.');

        // 3. Create Users & Employee Profiles
        const staff = [
            { name: 'Arjun Mehta', email: 'arjun@antigravity.io', designation: 'Technical Architect', dept: 'Engineering', rate: 2500 },
            { name: 'Priya Sharma', email: 'priya@antigravity.io', designation: 'Product Manager', dept: 'Product', rate: 2200 },
            { name: 'Rohan Gupta', email: 'rohan@antigravity.io', designation: 'Senior Developer', dept: 'Engineering', rate: 1800 }
        ];

        const userIds = [];
        for (const s of staff) {
            let user = await User.findOne({ email: s.email });
            if (!user) {
                user = await User.create({
                    name: s.name,
                    email: s.email,
                    password: 'password123',
                    role: 'user',
                    organizationId: orgId,
                    isVerified: true
                });
            }
            userIds.push(user._id);

            let profile = await EmployeeProfile.findOne({ userId: user._id });
            if (!profile) {
                await EmployeeProfile.create({
                    userId: user._id,
                    designation: s.designation,
                    department: s.dept,
                    hourlyRate: s.rate,
                    organizationId: orgId,
                    bankDetails: {
                        accountName: s.name,
                        accountNumber: `ACT${Math.floor(Math.random()*1000000)}`,
                        bankName: 'HDFC Bank',
                        ifscCode: 'HDFC0001234'
                    }
                });
            }
        }
        logger.info('Staff profiles seeded.');

        // 4. Create a Customer User for Invoices
        let customer = await User.findOne({ email: 'billing@globaltech.com' });
        if (!customer) {
            customer = await User.create({
                name: 'Global Tech Corp',
                email: 'billing@globaltech.com',
                password: 'password123',
                role: 'user',
                organizationId: orgId,
                isVerified: true
            });
        }

        // 5. Seed Historical Invoices (Last 12 Months)
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
            const invoiceNumber = `INV-2026-${String(12-i).padStart(3, '0')}`;
            
            // Generate some random growth
            const baseAmount = 800000 + (Math.random() * 400000);
            const amount = Math.floor(baseAmount * (1 + (11-i)*0.05)); // 5% growth each month

            const existingInv = await Invoice.findOne({ invoiceNumber, organizationId: orgId });
            if (!existingInv) {
                const subtotal = amount;
                const taxAmount = Math.floor(subtotal * 0.18);
                const totalAmount = subtotal + taxAmount;

                await Invoice.create({
                    invoiceNumber,
                    customerId: customer._id,
                    items: [{ 
                        description: 'Enterprise Software Services', 
                        quantity: 1, 
                        unitPrice: subtotal, 
                        amount: subtotal,
                        taxAmount: taxAmount,
                        taxRate: 18
                    }],
                    subtotal,
                    taxAmount,
                    totalAmount,
                    status: i > 1 ? 'paid' : 'sent', // Most recent are sent, older are paid
                    dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
                    issuedDate: date,
                    organizationId: orgId
                });

                // If paid, create ledger entry
                if (i > 1) {
                    await LedgerEntry.create({
                        description: `Payment for ${invoiceNumber}`,
                        sourceType: 'payment',
                        sourceId: new mongoose.Types.ObjectId(),
                        organizationId: orgId,
                        date: date,
                        entries: [
                            { accountId: accounts['1000']._id, debit: totalAmount, credit: 0 },
                            { accountId: accounts['4000']._id, debit: 0, credit: totalAmount }
                        ]
                    });
                }
            }
        }
        logger.info('Historical Invoices seeded (12 months).');

        // 6. Seed Recent Payroll Runs
        for (let j = 2; j >= 1; j--) {
            const date = new Date(now.getFullYear(), now.getMonth() - j, 28);
            const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            const runName = `${monthName} Monthly Payroll`;
            
            let run = await PayrollRun.findOne({ name: runName, organizationId: orgId });
            if (!run) {
                run = await PayrollRun.create({
                    name: runName,
                    periodStart: new Date(now.getFullYear(), now.getMonth() - j, 1),
                    periodEnd: new Date(now.getFullYear(), now.getMonth() - j, 28),
                    status: 'paid', // "finalized" is not in enum
                    totalGross: 0,
                    totalNet: 0,
                    employeeCount: userIds.length,
                    organizationId: orgId
                });

                let runGross = 0;
                let runNet = 0;

                for (const userId of userIds) {
                    const profile = await EmployeeProfile.findOne({ userId });
                    const hours = 160 + Math.floor(Math.random() * 20);
                    const gross = profile.hourlyRate * hours;
                    const tax = Math.floor(gross * 0.1);
                    const net = gross - tax;

                    await Payslip.create({
                        payrollRunId: run._id,
                        employeeId: userId,
                        employeeProfileId: profile._id,
                        periodStart: run.periodStart,
                        periodEnd: run.periodEnd,
                        totalHours: hours,
                        hourlyRate: profile.hourlyRate,
                        basicSalary: gross,
                        taxDeduction: tax,
                        grossSalary: gross,
                        netSalary: net,
                        status: 'paid',
                        organizationId: orgId
                    });

                    runGross += gross;
                    runNet += net;
                }

                run.totalGross = runGross;
                run.totalNet = runNet;
                await run.save();

                // Create Ledger Entry for Payroll
                await LedgerEntry.create({
                    description: `Payroll Disbursement - ${monthName}`,
                    sourceType: 'payroll',
                    sourceId: run._id,
                    organizationId: orgId,
                    date: date,
                    entries: [
                        { accountId: accounts['5100']._id, debit: runGross, credit: 0 },
                        { accountId: accounts['1000']._id, debit: 0, credit: runNet }
                    ]
                });
            }
        }
        logger.info('Recent Payroll seeded (2 months).');

        // ========================================
        // 7. Seed Expenses (15 varied entries)
        // ========================================
        const expenseSeeds = [
            // Office & Infrastructure
            { title: 'AWS Cloud Hosting - March', merchant: 'Amazon Web Services', category: 'Infrastructure', amount: 185000, status: 'paid', daysAgo: 25 },
            { title: 'Google Workspace Licenses', merchant: 'Google LLC', category: 'Software', amount: 42000, status: 'paid', daysAgo: 20 },
            { title: 'Figma Team Subscription', merchant: 'Figma Inc', category: 'Software', amount: 28500, status: 'approved', daysAgo: 15 },
            { title: 'WeWork Coworking - April', merchant: 'WeWork India', category: 'Office Rent', amount: 320000, status: 'paid', daysAgo: 5 },
            { title: 'Office Supplies & Stationery', merchant: 'Staples India', category: 'Office Supplies', amount: 8750, status: 'pending', daysAgo: 3 },
            // Travel
            { title: 'Client Visit - Mumbai Flight', merchant: 'IndiGo Airlines', category: 'Travel', amount: 12400, status: 'approved', daysAgo: 18 },
            { title: 'Hotel Stay - Oberoi Mumbai', merchant: 'Oberoi Hotels', category: 'Travel', amount: 24000, status: 'approved', daysAgo: 17 },
            { title: 'Cab Expenses - March', merchant: 'Uber Business', category: 'Travel', amount: 6800, status: 'paid', daysAgo: 30 },
            // Marketing
            { title: 'LinkedIn Ads Campaign Q1', merchant: 'LinkedIn Corp', category: 'Marketing', amount: 95000, status: 'paid', daysAgo: 40 },
            { title: 'Tech Conference Sponsorship', merchant: 'JSConf India', category: 'Marketing', amount: 150000, status: 'pending_approval', daysAgo: 8 },
            // Utilities & Misc
            { title: 'Electricity Bill - HQ', merchant: 'BSES Rajdhani', category: 'Utilities', amount: 18500, status: 'paid', daysAgo: 22 },
            { title: 'Internet - Leased Line', merchant: 'Airtel Business', category: 'Utilities', amount: 25000, status: 'paid', daysAgo: 22 },
            { title: 'Team Lunch - Sprint Retrospective', merchant: 'Zomato for Business', category: 'Office Supplies', amount: 4200, status: 'paid', daysAgo: 12 },
            { title: 'Legal Consultation - Contract Review', merchant: 'Khaitan & Co.', category: 'Professional Services', amount: 75000, status: 'draft', daysAgo: 2 },
            { title: 'Annual Security Audit', merchant: 'CyberSec India', category: 'Professional Services', amount: 250000, status: 'pending_approval', daysAgo: 1 }
        ];

        let expenseCounter = 1;
        for (const exp of expenseSeeds) {
            const expNum = `EXP-2026-${String(expenseCounter++).padStart(3, '0')}`;
            const existing = await Expense.findOne({ expenseNumber: expNum, organizationId: orgId });
            if (!existing) {
                const expDate = new Date(now.getTime() - exp.daysAgo * 24 * 60 * 60 * 1000);
                const taxAmt = Math.floor(exp.amount * 0.18);
                await Expense.create({
                    expenseNumber: expNum,
                    title: exp.title,
                    merchant: exp.merchant,
                    category: exp.category,
                    amount: exp.amount,
                    taxAmount: taxAmt,
                    date: expDate,
                    dueDate: new Date(expDate.getTime() + 15 * 24 * 60 * 60 * 1000),
                    vendor: exp.merchant,
                    description: `${exp.title} - auto-seeded`,
                    status: exp.status,
                    createdBy: userIds[Math.floor(Math.random() * userIds.length)],
                    organizationId: orgId
                });

                // Create corresponding ledger entry for paid expenses
                if (exp.status === 'paid') {
                    await LedgerEntry.create({
                        description: `Expense: ${exp.title}`,
                        sourceType: 'expense',
                        sourceId: new mongoose.Types.ObjectId(),
                        organizationId: orgId,
                        date: new Date(now.getTime() - exp.daysAgo * 24 * 60 * 60 * 1000),
                        entries: [
                            { accountId: accounts['5100']._id, debit: exp.amount + taxAmt, credit: 0 },
                            { accountId: accounts['1000']._id, debit: 0, credit: exp.amount + taxAmt }
                        ]
                    });
                }
            }
        }
        logger.info('Expenses seeded (15 entries across 7 categories).');

        // ========================================
        // 8. Seed Budgets (5 categories, varied utilization)
        // ========================================
        const budgetSeeds = [
            // CRITICAL: >90% spent
            { name: 'Q1 Infrastructure Budget', category: 'Infrastructure', allocated: 600000, spent: 555000, threshold: 80, desc: 'Cloud hosting, servers, and DevOps tooling' },
            // WARNING: 70-90% spent
            { name: 'Q1 Travel & Client Visits', category: 'Travel', allocated: 200000, spent: 162000, threshold: 75, desc: 'Client meetings, conferences, and team travel' },
            // HEALTHY: <50% spent
            { name: 'Q1 Marketing & Branding', category: 'Marketing', allocated: 500000, spent: 245000, threshold: 80, desc: 'Digital ads, sponsorships, and brand campaigns' },
            // OVER-BUDGET: >100% spent
            { name: 'Q1 Software Licenses', category: 'Software', allocated: 100000, spent: 112500, threshold: 85, desc: 'SaaS tools, IDE licenses, and design software' },
            // LOW: <20% spent
            { name: 'Q1 Professional Services', category: 'Professional Services', allocated: 400000, spent: 75000, threshold: 80, desc: 'Legal, audit, and consulting fees' }
        ];

        const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const qEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);

        for (const b of budgetSeeds) {
            const existing = await Budget.findOne({ name: b.name, organizationId: orgId });
            if (!existing) {
                await Budget.create({
                    name: b.name,
                    category: b.category,
                    allocatedAmount: b.allocated,
                    spentAmount: b.spent,
                    startDate: qStart,
                    endDate: qEnd,
                    alertThreshold: b.threshold,
                    status: 'active',
                    description: b.desc,
                    organizationId: orgId,
                    createdBy: userIds[0]
                });
            }
        }
        logger.info('Budgets seeded (5 categories with varied utilization).');

        logger.info('✅ Seeding completed: Antigravity Solutions environment is ready.');
        process.exit(0);
    } catch (error) {
        logger.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedFinance();
