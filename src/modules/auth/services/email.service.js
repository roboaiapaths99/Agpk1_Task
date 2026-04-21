const queueService = require('../../../core/queue');
const logger = require('../../../core/logger');
const nodemailer = require('nodemailer');
const { config } = require('../../../config');

/**
 * Service for handling email logic and offloading to background queue
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport(config.email);
    }

    async sendDirectEmail(options) {
        const { to, subject, html, attachments } = options;
        try {
            await this.transporter.sendMail({
                from: `"AGPK1 Enterprise" <${config.email.user}>`,
                to,
                subject,
                html,
                attachments: attachments || []
            });
            logger.info(`Email sent directly (fallback) to ${to}`);
        } catch (err) {
            logger.error(`Direct email delivery failed for ${to}:`, err);
            // We don't throw here to avoid crashing the main request if email fails
        }
    }

    async sendVerificationEmail(to, token) {
        const verifyURL = `http://localhost:5173/verify-email/${token}`;
        const html = `
            <h1>Verify your account</h1>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verifyURL}" target="_blank">Verify Email</a>
            <p>Alternatively, copy and paste this link into your browser: ${verifyURL}</p>
        `;

        const job = await queueService.addJob('email-queue', 'send-email', {
            to,
            subject: 'Verify your AGPK1-Task account',
            html
        });

        if (job.isMock) {
            await this.sendDirectEmail({ to, subject: 'Verify your AGPK1-Task account', html });
        }

        logger.debug(`Verification email queued for ${to}`);
    }

    async sendPasswordResetEmail(to, token) {
        const resetURL = `http://localhost:5173/reset-password/${token}`;
        const html = `
            <h1>Reset your password</h1>
            <p>You requested a password reset. Click the link below to proceed:</p>
            <a href="${resetURL}" target="_blank">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
        `;

        const job = await queueService.addJob('email-queue', 'send-email', {
            to,
            subject: 'Password Reset Request',
            html
        });

        if (job.isMock) {
            await this.sendDirectEmail({ to, subject: 'Password Reset Request', html });
        }

        logger.debug(`Password reset email queued for ${to}`);
    }

    async sendFinancialReport(to, subject, html, attachments) {
        const job = await queueService.addJob('email-queue', 'send-email', {
            to,
            subject,
            html,
            attachments
        });

        if (job.isMock) {
            await this.sendDirectEmail({ to, subject, html, attachments });
        }

        logger.debug(`Financial report distribution email queued for ${to}`);
    }

    async sendDunningEmail(to, data) {
        const { customerName, totalOverdue, oldestInvoiceDays, note } = data;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
                <h2 style="color: #2563eb;">Payment Reminder: Overdue Balance</h2>
                <p>Dear ${customerName},</p>
                <p>This is a formal reminder regarding your outstanding balance with us. Our records show that you have an overdue amount of <strong>${totalOverdue}</strong>.</p>
                <p>Your oldest invoice is currently <strong>${oldestInvoiceDays} days</strong> overdue.</p>
                ${note ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>Message from Collections:</strong><br/>${note}</div>` : ''}
                <p>Please arrange for the payment at your earliest convenience to maintain your credit status. If you have already made the payment, please disregard this notice.</p>
                <p>For any queries or copies of invoices, please reply directly to this email.</p>
                <br/>
                <p>Best Regards,<br/><strong>Finance Team</strong></p>
            </div>
        `;

        const job = await queueService.addJob('email-queue', 'send-email', {
            to,
            subject: `Payment Reminder - ${customerName} - Overdue Action`,
            html
        });

        if (job.isMock) {
            await this.sendDirectEmail({ 
                to, 
                subject: `Payment Reminder - ${customerName} - Overdue Action`, 
                html 
            });
        }

        logger.debug(`Dunning email queued for ${to}`);
    }
}

module.exports = new EmailService();
