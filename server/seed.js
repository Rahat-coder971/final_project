const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const mentors = [
    {
        name: 'Dr. Sarah Smith',
        email: 'sarah.smith@example.com',
        password: 'password123', // In real app, hash this!
        role: 'mentor',
        jobTitle: 'Senior React Engineer',
        bio: 'Ex-Google engineer with 10 years of experience.',
        skills: ['React', 'NodeJS', 'System Design'],
        rating: 4.9,
        availability: ['Mon 10:00 AM', 'Wed 02:00 PM', 'Fri 11:00 AM']
    },
    {
        name: 'James Wilson',
        email: 'james.wilson@example.com',
        password: 'password123',
        role: 'mentor',
        jobTitle: 'Full Stack Dev',
        bio: 'Helped 50+ students land their first job.',
        skills: ['Python', 'Django', 'PostgreSQL'],
        rating: 4.8,
        availability: ['Tue 09:00 AM', 'Thu 04:00 PM']
    },
    {
        name: 'Anita Roy',
        email: 'anita.roy@example.com',
        password: 'password123',
        role: 'mentor',
        jobTitle: 'Data Scientist',
        bio: 'PhD in AI, loves teaching machine learning basics.',
        skills: ['Python', 'Machine Learning', 'TensorFlow'],
        rating: 5.0,
        availability: ['Mon 01:00 PM', 'Fri 10:00 AM']
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Check if mentors already exist to avoid duplicates
        const count = await User.countDocuments({ role: 'mentor' });
        if (count > 0) {
            console.log('Mentors already exist. Skipping seed.');
            process.exit();
        }

        await User.insertMany(mentors);
        console.log('Mock Mentors Seeded Successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
