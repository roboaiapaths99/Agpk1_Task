const Invoice = require('../models/Invoice');
const User = require('../../../auth/models/User');
const { EVENTS } = require('../../../../utils/constants');
const eventBus = require('../../../../core/eventBus');
const { AppError } = require('../../../../core/errors');
const crypto = require('crypto');
const auditService = require('../../../audit/services/audit.service');

class InvoiceService {
    /**
     * Create a new invoice with auto-generated invoice number.
     * Accepts frontend fields: clientName, clientEmail, date, tax, total
     * and normalizes them to model fields: customerId, issuedDate, taxAmount, totalAmount
     */
    async createInvoice(data, organizationId, userId) {
        // Generate Invoice Number if not provided
        if (!data.invoiceNumber) {
            data.invoiceNumber = await this.generateInvoiceNumber(organizationId);
        }

        // --- Normalize client info ---
        // Frontend sends clientName + clientEmail; backend needs customerId
        if (!data.customerId && data.clientEmail && data.clientName) {
            let customer = await User.findOne({ email: data.clientEmail, organizationId });
            if (!customer) {
                const randomPassword = crypto.randomBytes(8).toString('hex');
                customer = await User.create({
                    name: data.clientName,
                    email: data.clientEmail,
                    password: randomPassword,
                    organizationId,
                    role: 'user',
                    isActive: true
                });
            }
            data.customerId = customer._id;
        }

        if (!data.customerId) {
            throw new AppError('Customer ID or Client details (email & name) are required', 400);
        }

        // --- Normalize item amounts ---
        if (data.items && Array.isArray(data.items)) {
            data.items = data.items.map(item => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.unitPrice) || 0;
                const rate = item.taxRate !== undefined ? Number(item.taxRate) : 18;
                const lineAmount = qty * price;
                const lineTax = Math.round(lineAmount * (rate / 100));
                return {
                    description: item.description,
                    quantity: qty,
                    unitPrice: price,
                    taxRate: rate,
                    amount: lineAmount,
                    taxAmount: lineTax
                };
            });
        }

        // --- Normalize totals ---
        // Frontend sends: subtotal, tax, total
        // Model expects: subtotal, taxAmount, totalAmount
        const subtotal = data.subtotal || data.items.reduce((s, i) => s + i.amount, 0);
        const taxAmount = data.taxAmount || data.tax || data.items.reduce((s, i) => s + i.taxAmount, 0);
        const totalAmount = data.totalAmount || data.total || (subtotal + taxAmount);

        // --- Normalize dates ---
        const dueDate = data.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        const issuedDate = data.date ? new Date(data.date) : new Date();

        const invoice = await Invoice.create({
            invoiceNumber: data.invoiceNumber,
            customerId: data.customerId,
            items: data.items,
            subtotal,
            taxAmount,
            totalAmount,
            currency: data.currency || 'INR',
            status: data.status || 'draft',
            dueDate,
            issuedDate,
            sourceType: data.sourceType || 'manual',
            sourceId: data.sourceId,
            notes: data.notes || '',
            terms: data.terms || '',
            branchId: data.branchId,
            organizationId,
            createdBy: userId
        });

        // Publish Event
        try {
            await eventBus.publish(EVENTS.INVOICE_CREATED, {
                invoiceId: invoice._id,
                organizationId,
                totalAmount: invoice.totalAmount,
                customerId: invoice.customerId,
                branchId: invoice.branchId
            }, organizationId, `inv_create_${invoice._id}`);
        } catch (err) {
            console.error('Event publish failed:', err.message);
        }

        // Audit Log
        try {
            await auditService.logAction({
                module: 'finance',
                entityType: 'Invoice',
                entityId: invoice._id,
                action: 'CREATE',
                newData: invoice,
                userId,
                organizationId
            });
        } catch (auditErr) {
            console.error('Audit logging failed:', auditErr.message);
        }

        return invoice;
    }

    /**
     * Generate a unique invoice number for the organization
     * Pattern: INV-YYYY-SEQ (e.g., INV-2026-0001)
     */
    async generateInvoiceNumber(organizationId) {
        const year = new Date().getFullYear();
        const prefix = `INV-${year}-`;

        const lastInvoice = await Invoice.findOne({
            organizationId,
            invoiceNumber: new RegExp(`^${prefix}`)
        }).sort({ createdAt: -1 });

        let sequence = 1;
        if (lastInvoice) {
            const parts = lastInvoice.invoiceNumber.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }

        return `${prefix}${sequence.toString().padStart(4, '0')}`;
    }

    async getInvoiceById(id, organizationId) {
        const invoice = await Invoice.findOne({ _id: id, organizationId })
            .populate('customerId', 'name email')
            .populate('branchId', 'name code');
        if (!invoice) throw new AppError('Invoice not found', 404);
        return invoice;
    }

    async updateInvoice(id, data, organizationId, userId) {
        // Fetch old document for audit diff
        const oldData = await Invoice.findOne({ _id: id, organizationId, deletedAt: null });
        if (!oldData) throw new AppError('Invoice not found', 404);

        // Normalize fields if frontend sends them
        const updateData = { ...data };
        if (data.tax !== undefined && data.taxAmount === undefined) updateData.taxAmount = data.tax;
        if (data.total !== undefined && data.totalAmount === undefined) updateData.totalAmount = data.total;
        delete updateData.tax;
        delete updateData.total;
        delete updateData.clientName;
        delete updateData.clientEmail;

        const invoice = await Invoice.findOneAndUpdate(
            { _id: id, organizationId, deletedAt: null },
            updateData,
            { new: true, runValidators: true }
        );

        // Audit Log
        if (invoice) {
            try {
                await auditService.logAction({
                    module: 'finance',
                    entityType: 'Invoice',
                    entityId: invoice._id,
                    action: 'UPDATE',
                    oldData,
                    newData: invoice,
                    userId,
                    organizationId
                });
            } catch (auditErr) {
                console.error('Audit logging failed:', auditErr.message);
            }
        }

        return invoice;
    }

    async updateInvoiceStatus(id, status, organizationId, userId) {
        // Fetch old document for audit diff
        const oldData = await Invoice.findOne({ _id: id, organizationId, deletedAt: null });
        if (!oldData) throw new AppError('Invoice not found', 404);

        const invoice = await Invoice.findOneAndUpdate(
            { _id: id, organizationId, deletedAt: null },
            { status },
            { new: true, runValidators: true }
        );

        if (!invoice) throw new AppError('Invoice not found', 404);

        // Audit Log
        try {
            await auditService.logAction({
                module: 'finance',
                entityType: 'Invoice',
                entityId: invoice._id,
                action: 'STATUS_CHANGE',
                oldData,
                newData: invoice,
                userId,
                organizationId
            });
        } catch (auditErr) {
            console.error('Audit logging failed:', auditErr.message);
        }

        if (status === 'paid') {
            try {
                await eventBus.publish(EVENTS.PAYMENT_RECEIVED, {
                    invoiceId: invoice._id,
                    organizationId,
                    amount: invoice.totalAmount
                }, organizationId, `inv_paid_${invoice._id}`);
            } catch (err) {
                console.error('Event publish failed:', err.message);
            }
        }

        return invoice;
    }

    async softDeleteInvoice(id, organizationId, userId) {
        const oldData = await Invoice.findOne({ _id: id, organizationId, deletedAt: null });
        
        const invoice = await Invoice.findOneAndUpdate(
            { _id: id, organizationId, deletedAt: null },
            { deletedAt: new Date() },
            { new: true }
        );
        if (!invoice) throw new AppError('Invoice not found or already deleted', 404);

        // Audit Log
        try {
            await auditService.logAction({
                module: 'finance',
                entityType: 'Invoice',
                entityId: invoice._id,
                action: 'DELETE',
                oldData,
                newData: invoice,
                userId,
                organizationId
            });
        } catch (auditErr) {
            console.error('Audit logging failed:', auditErr.message);
        }

        return invoice;
    }

    async restoreInvoice(id, organizationId) {
        const invoice = await Invoice.findOneAndUpdate(
            { _id: id, organizationId, deletedAt: { $ne: null } },
            { deletedAt: null },
            { new: true }
        );
        if (!invoice) throw new AppError('Invoice not found or not deleted', 404);
        return invoice;
    }

    async listInvoices(filters, organizationId) {
        const query = { organizationId, deletedAt: null };
        if (filters.status) query.status = filters.status;
        if (filters.branch) query.branchId = filters.branch;
        if (filters.isDeleted === 'true') {
            query.deletedAt = { $ne: null };
        } else if (filters.isDeleted === 'all') {
            delete query.deletedAt;
        }

        return await Invoice.find(query)
            .sort({ createdAt: -1 })
            .populate('customerId', 'name email')
            .populate('branchId', 'name code');
    }
}

module.exports = new InvoiceService();
