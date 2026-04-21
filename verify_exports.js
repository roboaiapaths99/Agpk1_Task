const path = require('path');
const ExcelExportService = require('./src/modules/operations/services/excel.service');
const ExcelJS = require('exceljs');
const assert = require('assert');

// Mock data
const mockInvoices = [
    {
        _id: '60d5f1f2e1b2c3d4e5f6a1b1',
        invoiceNumber: 'INV-001',
        customer: { name: 'Acme Corp', email: 'acme@example.com' },
        status: 'paid',
        issueDate: new Date('2026-04-01'),
        dueDate: new Date('2026-04-15'),
        subtotalAmount: 1000,
        taxAmount: 180,
        totalAmount: 1180,
        amountPaid: 1180,
        createdBy: { name: 'Admin User' }
    }
];

const mockExpenses = [
    {
        _id: '60d5f1f2e1b2c3d4e5f6a1b2',
        description: 'Office Supplies',
        category: 'office',
        amount: 500,
        date: new Date('2026-04-05'),
        status: 'approved',
        merchant: 'Staples',
        employeeId: { firstName: 'John', lastName: 'Doe', name: 'John Doe' },
        approvedBy: { firstName: 'Manager', lastName: 'X' }
    }
];

const mockJournalEntries = [
    {
        _id: '60d5f1f2e1b2c3d4e5f6a1b3',
        date: new Date('2026-04-10'),
        reference: 'JE-001',
        description: 'Monthly Rent',
        entries: [
            { accountId: { code: '5000', name: 'Rent Expense' }, debit: 2000, credit: 0 },
            { accountId: { code: '1000', name: 'Cash' }, debit: 0, credit: 2000 }
        ],
        status: 'posted',
        createdBy: { firstName: 'Admin', lastName: 'User' }
    }
];

const mockProjects = [
    {
        _id: '60d5f1f2e1b2c3d4e5f6a1b4',
        name: 'Alpha Project',
        status: 'ACTIVE',
        progress: 0.5,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        owner: { firstName: 'A', lastName: 'B' },
        metadata: { businessUnit: 'Tech' }
    }
];

// Correct model paths
const Invoice = require('./src/modules/finance/invoice/models/Invoice');
const Expense = require('./src/modules/finance/expenses/models/Expense');
const LedgerEntry = require('./src/modules/finance/ledger/models/LedgerEntry');
const { Project } = require('./src/modules/project/models/Project');

// Helper to mock mongoose fluent chain
const mockChain = (data) => {
    const fn = () => chain;
    const chain = {
        populate: fn,
        sort: fn,
        lean: () => Promise.resolve(data)
    };
    return chain;
};

async function verifyInvoices() {
    console.log('Verifying Invoice Export...');
    Invoice.find = () => mockChain(mockInvoices);
    const workbook = await ExcelExportService.exportInvoices('org_123');
    const summarySheet = workbook.getWorksheet('Summary');
    assert.strictEqual(summarySheet.getCell('B4').value, 1180);
    console.log('✅ Invoice Export Verified');
}

async function verifyExpenses() {
    console.log('Verifying Expense Export...');
    Expense.find = () => mockChain(mockExpenses);
    const workbook = await ExcelExportService.exportExpenses('org_123');
    const sheet = workbook.getWorksheet('Expenses');
    assert.strictEqual(sheet.getRow(2).getCell(5).value, 500);
    console.log('✅ Expense Export Verified');
}

async function verifyJournalEntries() {
    console.log('Verifying Journal Entry Export...');
    LedgerEntry.find = () => mockChain(mockJournalEntries);
    const workbook = await ExcelExportService.exportJournalEntries('org_123');
    const sheet = workbook.getWorksheet('General Journal');
    assert.strictEqual(sheet.getRow(2).getCell(3).value, '[5000] Rent Expense');
    assert.strictEqual(sheet.getRow(2).getCell(4).value, 2000); // Debit
    assert.strictEqual(sheet.getRow(3).getCell(5).value, 2000); // Credit
    console.log('✅ Journal Entry Export Verified');
}

async function verifyProjects() {
    console.log('Verifying Project Export...');
    Project.find = () => mockChain(mockProjects);
    const workbook = await ExcelExportService.exportProjects('org_123');
    const sheet = workbook.getWorksheet('Projects Overview');
    assert.strictEqual(sheet.getRow(2).getCell(1).value, 'Alpha Project');
    assert.strictEqual(sheet.getRow(2).getCell(2).value, 'ACTIVE');
    console.log('✅ Project Export Verified');
}

async function runTests() {
    try {
        await verifyInvoices();
        await verifyExpenses();
        await verifyJournalEntries();
        await verifyProjects();
        console.log('\nAll Excel Exports formatting and logic verified successfully!');
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

runTests();
