const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Student = require('./models/Student');
require('dotenv').config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const studentName = "Rahat Husain khan";
        const studentUser = await User.findOne({ name: studentName });

        if (!studentUser) {
            console.log("Student user not found!");
            return;
        }

        console.log(`Student ID: ${studentUser._id}`);

        // 1. Get Student Profile
        const studentProfile = await Student.findOne({ user: studentUser._id });
        console.log("Student Profile Weak Topics:", studentProfile.weakTopics);

        // 2. Get Recent Bookings
        const bookings = await Booking.find({ student: studentUser._id }).sort({ createdAt: -1 }).limit(3);

        console.log("\n--- Recent Bookings ---");
        bookings.forEach(b => {
            console.log(`Booking ID: ${b._id}`);
            console.log(`  Date: ${b.scheduledAt}`);
            console.log(`  Status: ${b.status}`);
            console.log(`  Outcome:`, b.outcome);
            if (b.outcome) {
                console.log(`    Score: ${b.outcome.score}`);
                console.log(`    WeakConcepts (Array):`, b.outcome.weakConcepts);
                console.log(`    FocusArea (String):`, b.outcome.focusArea);
            }
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

debug();
