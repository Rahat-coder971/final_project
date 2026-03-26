const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Mentor = require('./models/Mentor');
const Roadmap = require('./models/Roadmap');
const Booking = require('./models/Booking');
const Message = require('./models/Message');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/elevatehubproject')
    .then(async () => {
        console.log('MongoDB Connected');

        // Regex for Mentor Email
        const mentorEmailRegex = /blogify\.hub7789@gmail\.co/i;

        // Regex for Student Name/Email
        const studentNameRegex = /rahat/i;
        const studentEmailRegex = /rahathusainkhan/i; // Matches rahathusainkhan483@gmail.com

        try {
            // 1. Find Mentor
            const mentors = await User.find({ email: mentorEmailRegex });
            console.log('--- Found Mentors ---');
            mentors.forEach(m => console.log(`${m.name} (${m.email}) - ID: ${m._id}`));

            // 2. Find Student
            const students = await User.find({
                $or: [
                    { name: studentNameRegex },
                    { email: studentEmailRegex },
                    { email: 'rahat.studentt@gmail.com' } // Adding based on previous context
                ]
            });
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
                console.log(`Deleting data for Mentor: ${mentor.name} (${mentor.email})`);
                await Mentor.deleteMany({ user: mentor._id });
                await Booking.deleteMany({ mentor: mentor._id });
                await Message.deleteMany({ $or: [{ sender: mentor._id }, { recipient: mentor._id }] });
                await User.findByIdAndDelete(mentor._id);
                console.log('Mentor deleted.');
            }

            // Delete Student Data
            for (const student of students) {
                console.log(`Deleting data for Student: ${student.name} (${student.email})`);
                await Student.deleteMany({ user: student._id });
                await Roadmap.deleteMany({ student: student._id });
                await Booking.deleteMany({ student: student._id });
                await Message.deleteMany({ $or: [{ sender: student._id }, { recipient: student._id }] });
                await User.findByIdAndDelete(student._id);
                console.log('Student deleted.');
            }

            console.log('\n✅ Deletion Complete.');
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
