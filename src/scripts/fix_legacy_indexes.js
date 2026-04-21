const mongoose = require('mongoose');
const { config } = require('../config');
const logger = require('../core/logger');

const fixLegacyIndexes = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const userColl = collections.find(c => c.name === 'users');

        if (userColl) {
            console.log('Checking "users" collection for legacy indexes...');
            const indexes = await db.collection('users').indexes();
            console.log('Current indexes:', indexes.map(i => i.name));

            const problematicIndex = indexes.find(i => i.name === 'phone_1' || i.key.phone);
            if (problematicIndex) {
                console.log(`Dropping legacy index: ${problematicIndex.name}`);
                await db.collection('users').dropIndex(problematicIndex.name);
                console.log('Successfully dropped legacy index.');
            } else {
                console.log('No legacy "phone" index found.');
            }
        } else {
            console.log('"users" collection not found.');
        }

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing indexes:', error);
        process.exit(1);
    }
};

fixLegacyIndexes();
