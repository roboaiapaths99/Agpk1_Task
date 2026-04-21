const eventBus = require('../../../core/eventBus');
const { EVENTS } = require('../../../utils/constants');
const invoiceService = require('../invoice/services/invoice.service');
const Task = require('../../work-item/models/Task');
const logger = require('../../../core/logger');

/**
 * Finance Event Subscriber
 * Handles cross-module events to automate financial workflows
 */
const initFinanceSubscriber = () => {
    // 1. Task Completion -> Auto-Invoice Logic
    eventBus.subscribe(EVENTS.TASK_COMPLETED, async (data) => {
        try {
            const { taskId, organizationId, userId } = data;

            // Find task and check if it's billable
            const task = await Task.findOne({ _id: taskId, organizationId });
            if (!task || !task.isBillable) return;

            // Generate Draft Invoice
            await invoiceService.createInvoice({
                customerId: task.customerId || task.clientId, // Adjust based on Task schema
                items: [{
                    description: `Task: ${task.title}`,
                    quantity: 1,
                    unitPrice: task.billingRate || 0,
                    amount: task.billingRate || 0
                }],
                subtotal: task.billingRate || 0,
                taxAmount: 0,
                totalAmount: task.billingRate || 0,
                status: 'draft',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
                sourceType: 'task',
                sourceId: taskId
            }, organizationId, userId);

            logger.info(`Auto-invoice created for task ${taskId}`);
        } catch (error) {
            logger.error(`Error in TASK_COMPLETED subscriber: ${error.message}`);
        }
    });

    // 2. Ledger Integration: Invoice Created -> Posting to Sales/AR
    eventBus.subscribe(EVENTS.INVOICE_CREATED, async (data) => {
        try {
            const { invoiceId, totalAmount, branchId, organizationId, userId } = data;
            const ledgerService = require('../ledger/services/ledger.service');

            await ledgerService.postTransaction({
                description: `Invoice ${invoiceId} generated`,
                entries: [
                    { accountCode: '1200', debit: totalAmount, credit: 0 }, // Accounts Receivable
                    { accountCode: '4000', debit: 0, credit: totalAmount }  // Sales Revenue
                ],
                sourceType: 'invoice',
                sourceId: invoiceId,
                branchId: branchId
            }, organizationId, userId);

            logger.info(`Ledger entries posted for invoice ${invoiceId}`);
        } catch (error) {
            logger.error(`Ledger-Invoice logic error: ${error.message}`);
        }
    });

    // 3. Ledger Integration: Payment Received -> Transfer from AR to Cash/Bank
    eventBus.subscribe(EVENTS.PAYMENT_RECEIVED, async (data) => {
        try {
            const { paymentId, invoiceId, amount, branchId, organizationId, userId } = data;
            const ledgerService = require('../ledger/services/ledger.service');

            await ledgerService.postTransaction({
                description: `Payment ${paymentId} received for Invoice ${invoiceId}`,
                entries: [
                    { accountCode: '1000', debit: amount, credit: 0 }, // Cash/Bank
                    { accountCode: '1200', debit: 0, credit: amount }  // Accounts Receivable
                ],
                sourceType: 'payment',
                sourceId: paymentId,
                branchId: branchId
            }, organizationId, userId);

            logger.info(`Ledger entries posted for payment ${paymentId}`);
        } catch (error) {
            logger.error(`Ledger-Payment logic error: ${error.message}`);
        }
    });

    // 4. Ledger Integration: Expense Added -> Posting to Expense/Cash
    eventBus.subscribe(EVENTS.EXPENSE_ADDED, async (data) => {
        try {
            const { expenseId, amount, branchId, organizationId, userId } = data;
            const ledgerService = require('../ledger/services/ledger.service');

            await ledgerService.postTransaction({
                description: `Expense ${expenseId} recorded`,
                entries: [
                    { accountCode: '5000', debit: amount, credit: 0 }, // General Expense
                    { accountCode: '1000', debit: 0, credit: amount }  // Cash/Bank
                ],
                sourceType: 'expense',
                sourceId: expenseId,
                branchId: branchId
            }, organizationId, userId);

            logger.info(`Ledger entries posted for expense ${expenseId}`);
        } catch (error) {
            logger.error(`Ledger-Expense logic error: ${error.message}`);
        }
    });

    // 5. Inventory Integration -> Auto-Invoice
    eventBus.subscribe('INVENTORY_PRODUCT_SOLD', async (data) => {
        try {
            const { productId, quantity, unitPrice, customerId, organizationId } = data;
            await invoiceService.createInvoice({
                customerId,
                items: [{
                    description: `Sale of product ${productId}`,
                    quantity,
                    unitPrice,
                    taxRate: 18 // Global GST default
                }],
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3-day window
                sourceType: 'inventory',
                sourceId: productId
            }, organizationId);
            logger.info(`Inventory sales record created for product ${productId}`);
        } catch (error) {
            logger.error(`Finance-Inventory Sync Error: ${error.message}`);
        }
    });

    // 4. HR Integration -> Payroll Expense Entry
    eventBus.subscribe('HR_PAYROLL_PROCESSED', async (data) => {
        try {
            const { totalSalary, month, organizationId } = data;
            const expenseService = require('../expenses/services/expense.service');
            await expenseService.createExpense({
                title: `Payroll Disbursement - ${month}`,
                amount: totalSalary,
                category: 'Salaries & Wages',
                status: 'paid',
                date: new Date(),
                notes: 'Automated payroll expense entry'
            }, organizationId);
            logger.info(`Payroll expense recorded for ${month}`);
        } catch (error) {
            logger.error(`Finance-HR Payroll Sync Error: ${error.message}`);
        }
    });

    // 5. CRM Integration -> Customer Account Sync
    eventBus.subscribe('CRM_CUSTOMER_CREATED', async (data) => {
        try {
            const { customerId, organizationId } = data;
            // Optionally initialize dynamic ledger account for this specific customer
            // logger.info(`Initializing financial record for CRM customer: ${customerId}`);
        } catch (error) {
            logger.error(`Finance-CRM Sync Error: ${error.message}`);
        }
    });
};

module.exports = initFinanceSubscriber;
