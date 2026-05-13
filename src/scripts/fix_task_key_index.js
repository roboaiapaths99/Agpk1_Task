const mongoose = require('mongoose');
const { config } = require('../config');
const logger = require('../core/logger');

const fixTaskKeyIndex = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongoUri);
        console.log('Connected.');

        const db = mongoose.connection.db;
        console.log('Checking "tasks" collection for old unique key index...');
        const indexes = await db.collection('tasks').indexes();
        
        // Find the index that is unique on just 'key'
        const oldKeyIndex = indexes.find(i => i.unique && Object.keys(i.key).length === 1 && i.key.key);
        
        if (oldKeyIndex) {
            console.log(`Dropping old unique index: ${oldKeyIndex.name}`);
            await db.collection('tasks').dropIndex(oldKeyIndex.name);
            console.log('Successfully dropped old unique index.');
        } else {
            console.log('No old unique "key" index found.');
        }

        console.log('Done. The new compound index will be created automatically when the app starts.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing task key index:', error);
        process.exit(1);
    }
};

fixTaskKeyIndex();
