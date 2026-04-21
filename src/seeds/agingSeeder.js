const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const User = require('../modules/auth/models/User');
const Organization = require('../modules/auth/models/Organization');
const Invoice = require('../modules/finance/invoice/models/Invoice');
const Expense = require('../modules/finance/expenses/models/Expense');
const logger = require('../core/logger');

const seedAgingData = async () => {
    try {
        await connectDB();
        logger.info('DB Connected for aging data seeding...');

        // 1. Get Organization and Admin (re-use from primary seed)
        const org = await Organization.findOne({ slug: 'agility-core' });
        const admin = await User.findOne({ email: 'admin@agpk1.com' });
        
        if (!org || !admin) {
            logger.error('Base seed data not found. Please run primary seed first.');
            process.exit(1);
        }

        const orgId = org._id;
        const adminId = admin._id;

        // 2. Create Sample Customers if they don't exist
        const customerNames = ['Apex Corp', 'Visionary Inc', 'Nexus Solutions', 'Global Tech'];
        const customers = [];
        
        for (const name of customerNames) {
            let customer = await User.findOne({ email: `${name.toLowerCase().replace(' ', '')}@example.com` });
            if (!customer) {
                customer = await User.create({
                    name,
                    email: `${name.toLowerCase().replace(' ', '')}@example.com`,
                    password: 'password123',
                    role: 'user',
                    organizationId: orgId,
                    isVerified: true
                });
            }
            customers.push(customer);
        }
        logger.info('Customers ready');

        // 3. Clear existing invoices/expenses to avoid duplicates
        await Invoice.deleteMany({ organizationId: orgId });
        await Expense.deleteMany({ organizationId: orgId });

        const today = new Date();
        const buckets = [0, 15, 45, 75, 105, 135]; // Days offset to hit different buckets

        // 4. Seed Invoices (AR)
        for (let i = 0; i < 15; i++) {
            const customer = customers[i % customers.length];
            const offset = buckets[i % buckets.length];
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() - offset);
            
            const amount = Math.floor(Math.random() * 50000) + 5000;
            
            await Invoice.create({
                invoiceNumber: `INV-2024-${100 + i}`,
                customerId: customer._id,
                items: [{ description: 'Professional Services', quantity: 1, unitPrice: amount, amount }],
                subtotal: amount,
                taxAmount: 0,
                totalAmount: amount,
                status: offset === 0 ? 'sent' : 'overdue',
                dueDate,
                issuedDate: new Date(dueDate.getTime() - (15 * 86400000)),
                organizationId: orgId,
                createdBy: adminId,
                notes: `Aging sample - Bucket offset ${offset}`
            });
        }
        logger.info('Seeded Invoices (AR)');

        // 5. Seed Expenses (AP)
        const vendors = ['Amazon Web Services', 'DigitalOcean', 'Office Supplies Co', 'Property Management'];
        for (let i = 0; i < 12; i++) {
            const vendor = vendors[i % vendors.length];
            const offset = buckets[i % buckets.length];
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() - offset);
            
            const amount = Math.floor(Math.random() * 20000) + 1000;
            
            await Expense.create({
                expenseNumber: `EXP-2024-${200 + i}`,
                title: `${vendor} Monthly Bill`,
                category: i % 2 === 0 ? 'Technology' : 'Operations',
                amount,
                vendor,
                date: new Date(dueDate.getTime() - (30 * 86400000)),
                dueDate,
                status: offset === 0 ? 'pending' : 'approved',
                organizationId: orgId,
                createdBy: adminId,
                notes: `AP Aging sample - Bucket offset ${offset}`
            });
        }
        logger.info('Seeded Expenses (AP)');

        logger.info('✅ Aging data seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        logger.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedAgingData();
