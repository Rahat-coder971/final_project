const mongoose = require('mongoose');
const User = require('./models/User');
const Mentor = require('./models/Mentor');
const Student = require('./models/Student');
const Roadmap = require('./models/Roadmap');
const Booking = require('./models/Booking');
const Message = require('./models/Message');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Ensure Mentor exists
        const email = 'husainalamkhan26@gmail.com';
        let user = await User.findOne({ email });
        if (!user) {
            console.log('Mentor user not found, creating...');
            const salt = await bcrypt.genSalt(10);
            const hp = await bcrypt.hash('rahat@19', salt);
            user = await User.create({ name: 'Husain Mentor', email, password: hp, role: 'mentor' });
        } else {
            console.log('Mentor user found:', user._id);
            if (user.role !== 'mentor') {
                user.role = 'mentor';
                await user.save();
            }
        }

        let mentorProfile = await Mentor.findOne({ user: user._id });
        if (!mentorProfile) {
            mentorProfile = await Mentor.create({ user: user._id });
            console.log('Created Mentor Profile');
        }

        // 2. Ensure a Dummy Student exists
        const studentEmail = 'dummy_student@example.com';
        let studentUser = await User.findOne({ email: studentEmail });
        if (!studentUser) {
            const salt = await bcrypt.genSalt(10);
            const hp = await bcrypt.hash('password123', salt);
            studentUser = await User.create({ name: 'Dummy Student', email: studentEmail, password: hp, role: 'student' });
            console.log('Created Dummy Student');
        } else {
            console.log('Student user found:', studentUser._id);
        }

        let studentProfile = await Student.findOne({ user: studentUser._id });
        if (!studentProfile) {
            studentProfile = await Student.create({ user: studentUser._id, learningGoals: 'Learn React and Node.js' });
            console.log('Created Student Profile');
        }

        // 3. Create Booking (to link them)
        // Clear existing bookings to be sure
        await Booking.deleteMany({ mentor: user._id, student: studentUser._id });
        await Booking.create({
            mentor: user._id,
            student: studentUser._id,
            date: new Date(),
            time: '10:00 AM',
            status: 'completed'
        });
        console.log('Created/Refreshed Dummy Booking');

        // 4. Create Roadmap for Student
        await Roadmap.deleteMany({ student: studentUser._id });
        await Roadmap.create({
            student: studentUser._id,
            title: 'Full Stack Web Dev',
            goal: 'Become a Full Stack Developer',
            duration: 12,
            weeks: [
                {
                    week: 1,
                    title: 'HTML & CSS',
                    tasks: [
                        { day: 'Mon', activity: 'Learn Flexbox', completed: true },
                        { day: 'Tue', activity: 'Build a Layout', completed: false }
                    ]
                }
            ]
        });
        console.log('Created/Refreshed Dummy Roadmap');

        // 5. Create a Message
        await Message.create({ sender: studentUser._id, receiver: user._id, content: 'Hello Mentor, I need help!', read: false });
        console.log('Created Dummy Message');

        console.log('Seeding Complete');
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
