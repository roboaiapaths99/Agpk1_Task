const accountService = require('../services/account.service');
const catchAsync = require('../../../../utils/catchAsync');

class AccountController {
    createAccount = catchAsync(async (req, res) => {
        const account = await accountService.createAccount(req.body, req.user.organizationId);
        res.status(201).json({
            status: 'success',
            data: { account }
        });
    });

    getAccounts = catchAsync(async (req, res) => {
        const accounts = await accountService.getAccounts(req.user.organizationId, req.query);
        res.status(200).json({
            status: 'success',
            results: accounts.length,
            data: { accounts }
        });
    });

    getAccountTree = catchAsync(async (req, res) => {
        const tree = await accountService.getAccountTree(req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { tree }
        });
    });

    getAccount = catchAsync(async (req, res) => {
        const account = await accountService.getAccountById(req.params.id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { account }
        });
    });

    updateAccount = catchAsync(async (req, res) => {
        const account = await accountService.updateAccount(req.params.id, req.body, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { account }
        });
    });

    deleteAccount = catchAsync(async (req, res) => {
        await accountService.deleteAccount(req.params.id, req.user.organizationId);
        res.status(204).json({
            status: 'success',
            data: null
        });
    });

    seedDefaults = catchAsync(async (req, res) => {
        const results = await accountService.seedDefaultAccounts(req.user.organizationId);
        res.status(201).json({
            status: 'success',
            message: `Successfully seeded ${results.length} default accounts`,
            data: { seededCount: results.length }
        });
    });
}

module.exports = new AccountController();
