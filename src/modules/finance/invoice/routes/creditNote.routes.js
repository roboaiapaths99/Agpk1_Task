const express = require('express');
const creditNoteService = require('../services/creditNote.service');
const { authenticate } = require('../../../../middlewares/auth');
const { authorize } = require('../../../../middlewares/rbac');
const { validate } = require('../../../../middlewares/validate');
const Joi = require('joi');

const router = express.Router();

router.use(authenticate);

router.post('/',
    authorize('admin', 'accountant'),
    validate(Joi.object({
        invoiceId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        reason: Joi.string().required()
    })),
    async (req, res) => {
        try {
            const result = await creditNoteService.issueCreditNote(req.body, req.user.organizationId, req.user._id);
            res.status(201).json({ status: 'success', data: result });
        } catch (err) {
            res.status(400).json({ status: 'error', message: err.message });
        }
    }
);

router.get('/invoice/:invoiceId', async (req, res) => {
    const result = await creditNoteService.getByInvoice(req.params.invoiceId, req.user.organizationId);
    res.json({ status: 'success', data: result });
});

module.exports = router;
