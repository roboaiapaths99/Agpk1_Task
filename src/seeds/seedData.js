const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const User = require('../modules/auth/models/User');
const Task = require('../modules/work-item/models/Task');
const { Project, Milestone, Dependency } = require('../modules/project/models/Project');
const AutomationRule = require('../modules/automation/models/AutomationRule');
const Organization = require('../modules/auth/models/Organization');
const Account = require('../modules/finance/ledger/models/Account');
const LedgerEntry = require('../modules/finance/ledger/models/LedgerEntry');
const { TASK_STATUS, TASK_PRIORITY, USER_ROLES } = require('../utils/constants');
const logger = require('../core/logger');

const seedData = async () => {
    try {
        await connectDB();
        logger.info('DB Connected for seeding...');

        // 1. Clear existing data
        await mongoose.connection.db.dropCollection('users').catch(() => logger.info('Users collection did not exist'));
        await mongoose.connection.db.dropCollection('organizations').catch(() => logger.info('Organizations collection did not exist'));
        await Task.deleteMany({});
        await Project.deleteMany({});
        await Account.deleteMany({});
        await LedgerEntry.deleteMany({});
        await AutomationRule.deleteMany({});

        // 2. Create IDs beforehand to handle circular dependencies
        const orgId = new mongoose.Types.ObjectId();
        const adminId = new mongoose.Types.ObjectId();

        // 3. Create Organization
        const org = await Organization.create({
            _id: orgId,
            name: 'Agility Core',
            domain: 'agpk1.com',
            slug: 'agility-core',
            ownerId: adminId,
            settings: {
                maxUsers: 10,
                features: ['finance', 'projects', 'ai']
            }
        });
        logger.info('Created Organization');

        // 4. Create Admin & Users
        const admin = await User.create({
            _id: adminId,
            name: 'Admin User',
            email: 'admin@agpk1.com',
            password: 'password123',
            role: 'admin',
            organizationId: orgId,
            isVerified: true
        });

        const manager = await User.create({
            name: 'Project Manager',
            email: 'manager@agpk1.com',
            password: 'password123',
            role: 'manager',
            organizationId: orgId,
            isVerified: true
        });
        logger.info('Created Users');

        // 5. Create Finance Data (Accounts)
        const bankAccount = await Account.create({
            name: 'Main Bank Account',
            code: '1000',
            type: 'asset',
            isSystem: true,
            organizationId: orgId,
            balance: 50000
        });

        const pettyCash = await Account.create({
            name: 'Petty Cash',
            code: '1001',
            type: 'asset',
            isSystem: true,
            organizationId: orgId,
            balance: 2000
        });

        const rentExpense = await Account.create({
            name: 'Office Rent',
            code: '5000',
            type: 'expense',
            organizationId: orgId
        });

        const salesRevenue = await Account.create({
            name: 'Product Sales',
            code: '4000',
            type: 'revenue',
            organizationId: orgId
        });

        const equityAccount = await Account.create({
            name: 'Retained Earnings',
            code: '3000',
            type: 'equity',
            organizationId: orgId
        });
        logger.info('Created Accounts');

        // 6. Create Finance Data (Ledger Entries)
        // Opening Balance
        await LedgerEntry.create({
            description: 'Opening Balance',
            sourceType: 'opening_balance',
            organizationId: orgId,
            date: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            entries: [
                { accountId: bankAccount._id, debit: 50000, credit: 0 },
                { accountId: equityAccount._id, debit: 0, credit: 50000 }
            ]
        });

        // Some Revenue
        await LedgerEntry.create({
            description: 'Customer Payment - INV-001',
            sourceType: 'payment',
            organizationId: orgId,
            date: new Date(),
            entries: [
                { accountId: bankAccount._id, debit: 15000, credit: 0 },
                { accountId: salesRevenue._id, debit: 0, credit: 15000 }
            ]
        });

        // Some Expenses
        await LedgerEntry.create({
            description: 'Monthly Rent Payment',
            sourceType: 'expense',
            organizationId: orgId,
            date: new Date(),
            entries: [
                { accountId: rentExpense._id, debit: 5000, credit: 0 },
                { accountId: bankAccount._id, debit: 0, credit: 5000 }
            ]
        });
        logger.info('Created Ledger Entries');

        // 7. Create Sample Project & Tasks
        const project = await Project.create({
            name: 'Finance Stabilization',
            description: 'Refactoring reporting logic and data integrity',
            owner: manager._id,
            status: 'active',
            organizationId: orgId,
            keyPrefix: 'FIN'
        });

        await Task.create({
            title: 'Refactor Balance Sheet',
            description: 'Use ledger aggregation instead of source docs',
            status: 'completed',
            priority: 'high',
            assignee: admin._id,
            project: project._id,
            createdBy: admin._id,
            organizationId: orgId,
            key: 'FIN-1'
        });

        logger.info('✅ Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        logger.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
