const mongoose = require('mongoose');
const User = require('../server/models/User');
const Student = require('../server/models/Student');
const Mentor = require('../server/models/Mentor');
const Roadmap = require('../server/models/Roadmap');
const Booking = require('../server/models/Booking');
const Message = require('../server/models/Message');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ionic-orbit-v2')
    .then(async () => {
        console.log('MongoDB Connected');

        // Regex for Mentor Email (handle typos)
        const mentorEmailRegex = /blogify\.hub7789@gmail\.co/i;

        // Regex for Student Name (rahat)
        const studentNameRegex = /rahat/i;

        try {
            // 1. Find Mentor
            const mentors = await User.find({ email: mentorEmailRegex });
            console.log('--- Found Mentors ---');
            mentors.forEach(m => console.log(`${m.name} (${m.email}) - ID: ${m._id}`));

            // 2. Find Student
            const students = await User.find({ $or: [{ name: studentNameRegex }, { email: /rahathusainkhan483@gmail\.com/i }] });
            console.log('\n--- Found Students ---');
            students.forEach(s => console.log(`${s.name} (${s.email}) - ID: ${s._id}`));

            if (mentors.length === 0 && students.length === 0) {
                console.log('No users found to delete.');
                process.exit(0);
            }

            // Perform Deletion
            console.log('\n--- DELETING DATA ---');

            // Delete Mentor Data
            for (const mentor of mentors) {
                console.log(`Deleting data for Mentor: ${mentor.name}`);
                await Mentor.deleteMany({ user: mentor._id });
                await Booking.deleteMany({ mentor: mentor._id });
                await Message.deleteMany({ $or: [{ sender: mentor._id }, { recipient: mentor._id }] });
                await User.findByIdAndDelete(mentor._id);
            }

            // Delete Student Data
            for (const student of students) {
                console.log(`Deleting data for Student: ${student.name}`);
                await Student.deleteMany({ user: student._id });
                await Roadmap.deleteMany({ student: student._id });
                await Booking.deleteMany({ student: student._id });
                await Message.deleteMany({ $or: [{ sender: student._id }, { recipient: student._id }] });
                await User.findByIdAndDelete(student._id);
            }

            console.log('\n✅ Deletion Complete.');

        } catch (err) {
            console.error(err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.log(err));
