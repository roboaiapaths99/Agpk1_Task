const Account = require('../models/Account');
const { AppError } = require('../../../../core/errors');
const mongoose = require('mongoose');

class AccountService {
    /**
     * Create a new account in the Chart of Accounts
     */
    async createAccount(data, organizationId) {
        // Validate unique code per organization (already handled by index, but good to check explicitly for better error)
        const existingAccount = await Account.findOne({ organizationId, code: data.code });
        if (existingAccount) {
            throw new AppError(`Account code ${data.code} is already in use`, 400);
        }

        // Validate parent account if provided
        if (data.parentAccount) {
            const parent = await Account.findOne({ _id: data.parentAccount, organizationId });
            if (!parent) {
                throw new AppError('Parent account not found', 404);
            }
            // Optional: Validate that account type matches parent type
            if (parent.type !== data.type) {
                throw new AppError(`Account type must match parent account type (${parent.type})`, 400);
            }
        }

        return await Account.create({
            ...data,
            organizationId
        });
    }

    /**
     * Get all accounts for an organization with filters
     */
    async getAccounts(organizationId, filters = {}) {
        const query = { organizationId };

        if (filters.type) query.type = filters.type;
        if (filters.isActive !== undefined) query.isActive = filters.isActive;
        if (filters.search) {
            query.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { code: { $regex: filters.search, $options: 'i' } }
            ];
        }

        return await Account.find(query).sort({ code: 1 });
    }

    /**
     * Get accounts in a hierarchical tree structure
     */
    async getAccountTree(organizationId) {
        const allAccounts = await Account.find({ organizationId }).lean();
        
        const buildTree = (parentId = null) => {
            return allAccounts
                .filter(acc => String(acc.parentAccount || '') === String(parentId || ''))
                .map(acc => ({
                    ...acc,
                    children: buildTree(acc._id)
                }));
        };

        return buildTree();
    }

    /**
     * Get single account by ID
     */
    async getAccountById(id, organizationId) {
        const account = await Account.findOne({ _id: id, organizationId }).populate('parentAccount', 'name code');
        if (!account) {
            throw new AppError('Account not found', 404);
        }
        return account;
    }

    /**
     * Update an account
     */
    async updateAccount(id, data, organizationId) {
        const account = await Account.findOne({ _id: id, organizationId });
        if (!account) {
            throw new AppError('Account not found', 404);
        }

        // Block updates to system accounts for critical fields
        if (account.isSystem && (data.type || data.code)) {
            throw new AppError('Cannot modify type or code of a system-protected account', 400);
        }

        // Prevent circular reference if updating parentAccount
        if (data.parentAccount && String(data.parentAccount) === String(id)) {
            throw new AppError('An account cannot be its own parent', 400);
        }

        Object.assign(account, data);
        return await account.save();
    }

    /**
     * Soft delete or remove account
     */
    async deleteAccount(id, organizationId) {
        const account = await Account.findOne({ _id: id, organizationId });
        if (!account) {
            throw new AppError('Account not found', 404);
        }

        if (account.isSystem) {
            throw new AppError('System accounts cannot be deleted', 400);
        }

        if (account.balance !== 0) {
            throw new AppError('Accounts with a non-zero balance cannot be deleted. Please transfer funds first.', 400);
        }

        // Check if has children
        const hasChildren = await Account.exists({ parentAccount: id, organizationId });
        if (hasChildren) {
            throw new AppError('Cannot delete account with sub-accounts. Please reassign or delete children first.', 400);
        }

        return await Account.findOneAndDelete({ _id: id, organizationId });
    }

    /**
     * Seed industry-standard Chart of Accounts Template
     */
    async seedDefaultAccounts(organizationId) {
        const defaultAccounts = [
            // ASSETS (1000s)
            { code: '1000', name: 'Cash', type: 'asset', isSystem: true, description: 'Petty cash and on-hand currency' },
            { code: '1010', name: 'Main Bank Account', type: 'asset', description: 'Primary operating bank account' },
            { code: '1100', name: 'Accounts Receivable', type: 'asset', isSystem: true, description: 'Payments due from customers' },
            { code: '1200', name: 'Prepaid Expenses', type: 'asset', description: 'Payments made in advance' },
            { code: '1500', name: 'Fixed Assets', type: 'asset', description: 'Long-term physical assets' },
            
            // LIABILITIES (2000s)
            { code: '2000', name: 'Accounts Payable', type: 'liability', isSystem: true, description: 'Amounts owed to vendors' },
            { code: '2100', name: 'Accrued Liabilities', type: 'liability', description: 'Expenses incurred but not yet paid' },
            { code: '2200', name: 'Loans Payable', type: 'liability', description: 'Debt obligations' },
            { code: '2300', name: 'Tax Payable', type: 'liability', description: 'Sales and income taxes collected' },
            
            // EQUITY (3000s)
            { code: '3000', name: 'Owners Equity', type: 'equity', description: 'Owner capital contribution' },
            { code: '3100', name: 'Retained Earnings', type: 'equity', isSystem: true, description: 'Accumulated profits/losses' },
            
            // REVENUE (4000s)
            { code: '4000', name: 'Sales Revenue', type: 'revenue', description: 'Income from product sales' },
            { code: '4100', name: 'Service Revenue', type: 'revenue', description: 'Income from services provided' },
            { code: '4200', name: 'Other Income', type: 'revenue', description: 'Miscellaneous revenue' },
            
            // EXPENSES (5000s)
            { code: '5000', name: 'Cost of Goods Sold', type: 'expense', description: 'Direct costs of product sales' },
            { code: '5100', name: 'Salaries and Wages', type: 'expense', description: 'Employee compensation' },
            { code: '5200', name: 'Rent Expense', type: 'expense', description: 'Facility rental costs' },
            { code: '5300', name: 'Utilities', type: 'expense', description: 'Water, electricity, internet' },
            { code: '5400', name: 'Office Supplies', type: 'expense', description: 'Consumables for administration' },
            { code: '5500', name: 'Marketing & Advertising', type: 'expense', description: 'Promotion and brand awareness' },
            { code: '5600', name: 'Depreciation Expense', type: 'expense', description: 'Non-cash asset value reduction' },
            { code: '5900', name: 'Miscellaneous Expenses', type: 'expense', description: 'General overhead' }
        ];

        const results = [];
        for (const acc of defaultAccounts) {
            const existing = await Account.findOne({ organizationId, code: acc.code });
            if (!existing) {
                results.push(await Account.create({ ...acc, organizationId }));
            }
        }
        return results;
    }
}

module.exports = new AccountService();
