const paymentService = require('../services/payment.service');
const catchAsync = require('../../../../utils/catchAsync');

class PaymentController {
    recordPayment = catchAsync(async (req, res) => {
        const payment = await paymentService.recordPayment(req.body, req.user.organizationId, req.user._id);
        res.status(201).json({
            status: 'success',
            data: { payment }
        });
    });

    getPayment = catchAsync(async (req, res) => {
        const payment = await paymentService.getPaymentById(req.params.id, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            data: { payment }
        });
    });

    getAllPayments = catchAsync(async (req, res) => {
        const payments = await paymentService.listPayments(req.query, req.user.organizationId);
        res.status(200).json({
            status: 'success',
            results: payments.length,
            data: { payments }
        });
    });
}

module.exports = new PaymentController();
