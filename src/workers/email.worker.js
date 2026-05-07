const { Worker } = require('bullmq');
const { config } = require('../config');
const logger = require('../core/logger');
const nodemailer = require('nodemailer');

/**
 * Worker for processing email jobs
 */
const initializeEmailWorker = () => {
    // Re-use existing email transport logic or recreate here
    // For this implementation, we'll assume the email worker handles SMTP directly
    const transporter = nodemailer.createTransport(config.email);

    const worker = new Worker('email-queue', async (job) => {
        const { to, subject, html, attachments } = job.data;

        logger.info(`Processing email job: ${job.id} to ${to}`);

        try {
            await transporter.sendMail({
                from: `"AGPK1 Enterprise" <${config.email.auth.user}>`,
                to,
                subject,
                html,
                attachments: attachments || []
            });
            logger.info(`Email sent successfully to ${to} (Job: ${job.id})`);
        } catch (err) {
            logger.error(`Failed to send email to ${to} (Job: ${job.id}):`, err);
            throw err; // Allow BullMQ to retry based on queue settings
        }
    }, {
        connection: {
            url: config.cache.redisUrl || 'redis://localhost:6379'
        },
        concurrency: 5 // Process 5 emails at a time
    });

    worker.on('failed', (job, err) => {
        logger.error(`Email Job ${job.id} failed after attempts:`, err);
    });

    worker.on('completed', (job) => {
        logger.debug(`Email Job ${job.id} completed.`);
    });

    logger.info('Email Worker initialized and listening for jobs.');
    return worker;
};

module.exports = initializeEmailWorker;
