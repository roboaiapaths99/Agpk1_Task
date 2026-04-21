const mongoose = require('mongoose');
const { connectDB } = require('./src/config/database');
const Invoice = require('./src/modules/finance/invoice/models/Invoice');
const Expense = require('./src/modules/finance/expenses/models/Expense');
const User = require('./src/modules/auth/models/User');
const Organization = require('./src/modules/auth/models/Organization');

const seedAgingData = async () => {
    try {
        await connectDB();
        console.log('Seeding Aging Data...');

        const org = await Organization.findOne({ slug: 'agility-core' });
        const admin = await User.findOne({ email: 'admin@agpk1.com' });
        
        if (!org || !admin) {
            console.error('Core seed data not found. Run npm run seed first.');
            process.exit(1);
        }

        const orgId = org._id;

        // Create some Customers (Users)
        const customers = await User.insertMany([
            { name: 'Acme Corp', email: 'billing@acme.com', password: 'password123', role: 'guest', organizationId: orgId, isVerified: true },
            { name: 'Globex Inc', email: 'finance@globex.com', password: 'password123', role: 'guest', organizationId: orgId, isVerified: true },
            { name: 'Stark Industries', email: 'payments@stark.com', password: 'password123', role: 'guest', organizationId: orgId, isVerified: true }
        ]);

        const today = new Date();
        const subtractDays = (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() - days);
            return result;
        };

        // 1. AR Invoices
        await Invoice.deleteMany({ organizationId: orgId });
        await Invoice.insertMany([
            // Current
            { invoiceNumber: 'INV-001', customerId: customers[0]._id, totalAmount: 5000, balance: 5000, status: 'sent', dueDate: subtractDays(today, -10), organizationId: orgId, date: subtractDays(today, 5) },
            // 1-30 Days Overdue
            { invoiceNumber: 'INV-002', customerId: customers[1]._id, totalAmount: 12000, balance: 12000, status: 'sent', dueDate: subtractDays(today, 15), organizationId: orgId, date: subtractDays(today, 45) },
            // 31-60 Days Overdue
            { invoiceNumber: 'INV-003', customerId: customers[2]._id, totalAmount: 8500, balance: 8500, status: 'sent', dueDate: subtractDays(today, 45), organizationId: orgId, date: subtractDays(today, 75) },
            // 61-90 Days Overdue
            { invoiceNumber: 'INV-004', customerId: customers[0]._id, totalAmount: 15400, balance: 15400, status: 'sent', dueDate: subtractDays(today, 75), organizationId: orgId, date: subtractDays(today, 105) },
            // 91-120 Days Overdue
            { invoiceNumber: 'INV-005', customerId: customers[1]._id, totalAmount: 3200, balance: 3200, status: 'sent', dueDate: subtractDays(today, 105), organizationId: orgId, date: subtractDays(today, 135) },
            // 120+ Days Overdue
            { invoiceNumber: 'INV-006', customerId: customers[2]._id, totalAmount: 25000, balance: 25000, status: 'sent', dueDate: subtractDays(today, 150), organizationId: orgId, date: subtractDays(today, 180) }
        ]);

        // 2. AP Expenses
        await Expense.deleteMany({ organizationId: orgId });
        await Expense.insertMany([
            // Current
            { amount: 3000, category: 'Utilities', description: 'Electric Bill', status: 'approved', date: subtractDays(today, 5), dueDate: subtractDays(today, -15), organizationId: orgId },
            // 1-30 Days Overdue
            { amount: 1500, category: 'Supplies', description: 'Office Paper', status: 'approved', date: subtractDays(today, 40), dueDate: subtractDays(today, 10), organizationId: orgId },
            // 91-120 Days Overdue
            { amount: 50000, category: 'Rent', description: 'Q1 Office Rent', status: 'approved', date: subtractDays(today, 150), dueDate: subtractDays(today, 120), organizationId: orgId }
        ]);

        console.log('✅ Aging seed data created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedAgingData();
