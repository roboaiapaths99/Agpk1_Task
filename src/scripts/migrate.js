const fs = require('fs').promises;
const path = require('path');
const Migration = require('../core/models/migration.model');
const logger = require('../core/logger');

/**
 * Lightweight migration runner for enterprise environments
 */
const runMigrations = async () => {
    const migrationsDir = path.join(__dirname, '../migrations');

    try {
        // Ensure migrations directory exists
        await fs.mkdir(migrationsDir, { recursive: true });

        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files.filter(f => f.endsWith('.js')).sort();

        logger.info(`Found ${migrationFiles.length} migration files.`);

        for (const file of migrationFiles) {
            const migrationName = file.replace('.js', '');

            // Check if already executed
            const alreadyRun = await Migration.findOne({ name: migrationName });
            if (alreadyRun) {
                continue;
            }

            logger.info(`Running migration: ${migrationName}...`);

            const migrationPath = path.join(migrationsDir, file);
            const migration = require(migrationPath);

            if (typeof migration.up !== 'function') {
                logger.error(`Migration ${migrationName} does not have an 'up' function.`);
                continue;
            }

            // Execute migration
            await migration.up();

            // Record execution
            await Migration.create({ name: migrationName });

            logger.info(`Successfully completed migration: ${migrationName}`);
        }

        logger.info('Database migrations check completed.');
    } catch (error) {
        logger.error('Critical error during database migrations:', error);
        throw error;
    }
};

module.exports = { runMigrations };
