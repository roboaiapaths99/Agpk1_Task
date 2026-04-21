const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: './.env' }); // Adjust if your .env is elsewhere

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const User = require('./src/modules/auth/models/User');

        // Find the admin user
        let admin = await User.findOne({ email: 'admin@agpk1.com' });
        if (!admin) {
            console.log('Admin user not found, please sign up first.');
        } else {
            admin.isEmailVerified = true;
            admin.password = await bcrypt.hash('password123', 10);
            await admin.save();
            console.log('Admin verified and password reset to password123');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

run();
