const CreditNote = require('../models/CreditNote');
const Invoice = require('../models/Invoice');
const LedgerService = require('../../ledger/services/ledger.service');

class CreditNoteService {
    /**
     * Issue a credit note against an invoice
     */
    async issueCreditNote(noteData, organizationId, userId) {
        const { invoiceId, amount, reason, branchId } = noteData;

        // 1. Verify Invoice
        const invoice = await Invoice.findOne({ _id: invoiceId, organizationId });
        if (!invoice) throw new Error('Invoice not found');

        // 2. Count existing credit notes for sequence
        const count = await CreditNote.countDocuments({ organizationId });
        const noteNumber = `CN-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        // 3. Create Note
        const creditNote = await CreditNote.create({
            noteNumber,
            invoiceId,
            amount,
            reason,
            branchId: branchId || invoice.branchId, // Inherit from invoice if not specified
            status: 'issued',
            organizationId,
            createdBy: userId
        });

        // 4. Update Ledger (Reverse Revenue)
        // Entries: Debit Revenue (reverse recognition), Credit Accounts Receivable (decrease what customer owes)
        await LedgerService.postTransaction({
            description: `Credit Note ${noteNumber} for Invoice ${invoice.invoiceNumber}`,
            entries: [
                { accountCode: '4001', debit: amount, credit: 0 }, // Revenue reversed
                { accountCode: '1100', debit: 0, credit: amount }  // AR decreased
            ],
            sourceType: 'CreditNote',
            sourceId: creditNote._id,
            branchId: creditNote.branchId
        }, organizationId, userId);

        return creditNote;
    }

    async getByInvoice(invoiceId, organizationId) {
        return await CreditNote.find({ invoiceId, organizationId });
    }
}

module.exports = new CreditNoteService();
