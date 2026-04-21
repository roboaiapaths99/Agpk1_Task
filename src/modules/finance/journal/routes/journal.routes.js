const express = require('express');
const journalController = require('../controllers/journal.controller');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');
const validate = require('../../../../middleware/validate');
const financeValidator = require('../../utils/finance.validator');
const checkPeriodLock = require('../../../../middleware/periodLock');

const router = express.Router();

router.use(authenticate);

router.route('/')
    .get(journalController.getAllJournalEntries)
    .post(
        authorize('admin', 'accountant'), 
        checkPeriodLock, 
        validate(financeValidator.createJournalEntry), 
        journalController.createJournalEntry
    );

router.route('/:id')
    .get(journalController.getJournalEntry);

router.post('/:id/reverse', authorize('admin', 'accountant'), checkPeriodLock, journalController.reverseJournalEntry);

router.patch('/:id/void', authorize('admin', 'accountant'), checkPeriodLock, journalController.voidJournalEntry);

module.exports = router;
