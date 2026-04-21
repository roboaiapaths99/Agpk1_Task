const Payment = require('../models/Payment');
const Invoice = require('../../invoice/models/Invoice');
const eventBus = require('../../../../core/eventBus');
const { EVENTS } = require('../../../../utils/constants');
const { AppError } = require('../../../../core/errors');

class PaymentService {
    async recordPayment(data, organizationId, userId) {
        const { invoiceId, amount } = data;

        // 1. Verify invoice exists
        const invoice = await Invoice.findOne({ _id: invoiceId, organizationId });
        if (!invoice) throw new AppError('Invoice not found', 404);

        // 2. Create Payment record
        const payment = await Payment.create({
            ...data,
            organizationId,
            createdBy: userId
        });

        // 3. Update Invoice Status
        const payments = await Payment.find({ invoiceId, organizationId, status: 'completed' });
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        let newStatus = invoice.status;
        if (totalPaid >= invoice.totalAmount) {
            newStatus = 'paid';
        } else if (totalPaid > 0) {
            newStatus = 'partial';
        }

        if (newStatus !== invoice.status) {
            await Invoice.findByIdAndUpdate(invoiceId, { status: newStatus });
        }

        // 4. Publish Event
        await eventBus.publish(EVENTS.PAYMENT_RECEIVED, {
            paymentId: payment._id,
            invoiceId,
            amount,
            organizationId,
            branchId: payment.branchId,
            isFullyPaid: newStatus === 'paid'
        }, organizationId, `pay_rec_${payment._id}`);

        return payment;
    }

    async getPaymentById(id, organizationId) {
        const payment = await Payment.findOne({ _id: id, organizationId }).populate('invoiceId');
        if (!payment) throw new AppError('Payment not found', 404);
        return payment;
    }

    async listPayments(filters, organizationId) {
        return await Payment.find({ ...filters, organizationId }).sort({ createdAt: -1 });
    }
}

module.exports = new PaymentService();
