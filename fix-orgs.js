const mongoose = require('mongoose');
const User = require('./src/modules/auth/models/User');
const Organization = require('./src/modules/auth/models/Organization');
const config = require('./src/config');

async function fix() {
    await mongoose.connect(config.mongoUri);
    const org = await Organization.findOne();
    if (!org) {
        console.log("No organization found, cannot fix");
        process.exit(1);
    }

    const result = await User.updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: org._id } }
    );
    console.log(`Updated ${result.modifiedCount} users to org ${org.name}`);
    process.exit(0);
}
fix();
