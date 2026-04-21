const mongoose = require('mongoose');
const User = require('./src/modules/auth/models/User');
const Document = require('./src/modules/docs/models/Document');
const config = require('./src/config');
const docService = require('./src/modules/docs/services/doc.service');

async function check() {
    await mongoose.connect(config.mongoUri);
    console.log('Connected');
    const user = await User.findOne();
    console.log('User orgId:', user.organizationId);

    try {
        await docService.create({
            title: '',
            content: '',
            projectId: null,
            parentDocId: null,
            templateType: 'prd',
            organizationId: user.organizationId,
            userId: user._id,
        });
        console.log('Success');
    } catch (err) {
        console.error('Validation error:', JSON.stringify(err.errors, null, 2));
    }
    process.exit(0);
}

check();
