const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
const fs = require('fs');

// Manual .env parsing
try {
    const envPath = path.join(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn("Could not read .env file manually", e);
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const findUser = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected');

        const users = await User.find({
            $or: [
                { name: { $regex: 'rahat', $options: 'i' } },
                { email: { $regex: 'rahat', $options: 'i' } }
            ]
        });

        console.log(`Found ${users.length} users matching 'rahat':`);
        users.forEach(u => console.log(`- ID: ${u._id}, Name: "${u.name}", Email: ${u.email}`));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

findUser();
