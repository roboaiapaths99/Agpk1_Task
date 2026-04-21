const journalService = require('../services/journal.service');
const catchAsync = require('../../../../utils/catchAsync');

exports.createJournalEntry = catchAsync(async (req, res) => {
    const entry = await journalService.createJournalEntry(req.body, req.user.organizationId, req.user._id);
    res.status(201).json({
        status: 'success',
        data: { entry }
    });
});

exports.getAllJournalEntries = catchAsync(async (req, res) => {
    const entries = await journalService.getJournalEntries(req.user.organizationId, req.query);
    res.status(200).json({
        status: 'success',
        results: entries.length,
        data: { entries }
    });
});

exports.getJournalEntry = catchAsync(async (req, res) => {
    const entry = await journalService.getJournalEntryById(req.params.id, req.user.organizationId);
    res.status(200).json({
        status: 'success',
        data: { entry }
    });
});

exports.reverseJournalEntry = catchAsync(async (req, res) => {
    const entry = await journalService.reverseEntry(req.params.id, req.user.organizationId, req.user._id);
    res.status(201).json({
        status: 'success',
        data: { entry }
    });
});

exports.voidJournalEntry = catchAsync(async (req, res) => {
    const entry = await journalService.voidEntry(req.params.id, req.user.organizationId, req.user._id);
    res.status(200).json({
        status: 'success',
        data: { entry }
    });
});
