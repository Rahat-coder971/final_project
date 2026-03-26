const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ionic-orbit-v2')
    .then(async () => {
        console.log('MongoDB Connected');

        try {
            const users = await User.find({});
            console.log('--- ALL USERS ---');
            users.forEach(u => console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, ID: ${u._id}`));

            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
