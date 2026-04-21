const fs = require('fs');
const path = require('path');
const logger = require('../../../core/logger');

class CleanupService {
    /**
     * Deletes temporary PDF files older than 24 hours
     */
    async cleanupTempPdfs() {
        const tempDir = path.join(process.cwd(), 'public', 'temp', 'pdfs');
        
        if (!fs.existsSync(tempDir)) {
            logger.info('Cleanup: Temp PDF directory does not exist. Skipping.');
            return;
        }

        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        const expirationTime = 24 * 60 * 60 * 1000; // 24 hours

        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtime.getTime() > expirationTime) {
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } catch (err) {
                    logger.error(`Cleanup error deleting file ${file}: ${err.message}`);
                }
            }
        }

        logger.info(`Cleanup: Deleted ${deletedCount} temporary PDF files.`);
        return deletedCount;
    }
}

const service = new CleanupService();
// Run once on startup
service.cleanupTempPdfs().catch(err => logger.error('Startup cleanup failed:', err));

module.exports = service;
