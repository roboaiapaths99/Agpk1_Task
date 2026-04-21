const Joi = require('joi');

const financeValidator = {
    // Invoice Validation — accepts both customerId OR clientName+clientEmail
    createInvoice: Joi.object({
        customerId: Joi.string().optional(),
        clientName: Joi.string().optional(),
        clientEmail: Joi.string().email().optional(),
        invoiceNumber: Joi.string().optional(),
        items: Joi.array().items(Joi.object({
            description: Joi.string().required(),
            quantity: Joi.number().min(1).required(),
            unitPrice: Joi.number().min(0).required(),
            taxRate: Joi.number().min(0).default(0),
            amount: Joi.number().optional(),
            taxAmount: Joi.number().optional()
        })).min(1).required(),
        dueDate: Joi.date().optional(),
        date: Joi.date().optional(),
        currency: Joi.string().default('INR'),
        notes: Joi.string().allow(''),
        terms: Joi.string().allow(''),
        branchId: Joi.string().optional(),
        subtotal: Joi.number().optional(),
        tax: Joi.number().optional(),
        taxAmount: Joi.number().optional(),
        total: Joi.number().optional(),
        totalAmount: Joi.number().optional(),
        sourceType: Joi.string().valid('manual', 'task', 'project', 'inventory').optional(),
        sourceId: Joi.string().optional()
    }),

    updateInvoiceStatus: Joi.object({
        status: Joi.string().valid('sent', 'paid', 'partial', 'cancelled', 'overdue').required()
    }),

    // Payment Validation
    recordPayment: Joi.object({
        invoiceId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        method: Joi.string().valid('cash', 'bank', 'upi', 'card', 'cheque', 'other').required(),
        reference: Joi.string().allow(''),
        paymentDate: Joi.date().default(Date.now),
        notes: Joi.string().allow('')
    }),

    // Expense Validation — accepts merchant OR title
    createExpense: Joi.object({
        title: Joi.string().optional(),
        merchant: Joi.string().optional(),
        amount: Joi.number().positive().required(),
        category: Joi.string().required(),
        date: Joi.date().default(Date.now),
        vendor: Joi.string().allow('').optional(),
        description: Joi.string().allow('').optional(),
        notes: Joi.string().allow('').optional(),
        branchId: Joi.string().optional(),
        paymentMethod: Joi.string().optional(),
        referenceNumber: Joi.string().allow('').optional(),
        taxAmount: Joi.number().optional(),
        status: Joi.string().optional(),
        projectId: Joi.string().optional(),
        taskId: Joi.string().optional()
    }),

    updateExpenseStatus: Joi.object({
        status: Joi.string().valid('approved', 'rejected', 'paid').required()
    }),

    // Branch Validation
    createBranch: Joi.object({
        name: Joi.string().required(),
        code: Joi.string().required(),
        address: Joi.string().allow(''),
        city: Joi.string().allow(''),
        state: Joi.string().allow(''),
        country: Joi.string().allow(''),
        zipCode: Joi.string().allow(''),
        phone: Joi.string().allow(''),
        email: Joi.string().email().allow(''),
        isActive: Joi.boolean().optional()
    }),

    updateBranch: Joi.object({
        name: Joi.string(),
        code: Joi.string(),
        address: Joi.string().allow(''),
        city: Joi.string().allow(''),
        state: Joi.string().allow(''),
        country: Joi.string().allow(''),
        zipCode: Joi.string().allow(''),
        phone: Joi.string().allow(''),
        email: Joi.string().email().allow(''),
        isActive: Joi.boolean()
    }),

    // Account (Chart of Accounts) Validation
    createAccount: Joi.object({
        code: Joi.string().min(4).max(10).required(),
        name: Joi.string().required(),
        type: Joi.string().valid('asset', 'liability', 'equity', 'revenue', 'expense').required(),
        description: Joi.string().allow('').optional(),
        parentAccount: Joi.string().optional(),
        isActive: Joi.boolean().optional()
    }),

    updateAccount: Joi.object({
        code: Joi.string().min(4).max(10).optional(),
        name: Joi.string().optional(),
        type: Joi.string().valid('asset', 'liability', 'equity', 'revenue', 'expense').optional(),
        description: Joi.string().allow('').optional(),
        parentAccount: Joi.string().optional(),
        isActive: Joi.boolean().optional()
    }),

    // Journal Entry Validation
    createJournalEntry: Joi.object({
        description: Joi.string().required(),
        date: Joi.date().optional(),
        entries: Joi.array().items(Joi.object({
            accountCode: Joi.string().required(),
            debit: Joi.number().min(0).default(0),
            credit: Joi.number().min(0).default(0)
        })).min(2).required(),
        branchId: Joi.string().optional(),
        isReversing: Joi.boolean().default(false),
        reversalDate: Joi.date().when('isReversing', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        notes: Joi.string().allow('').optional()
    })
};

module.exports = financeValidator;
