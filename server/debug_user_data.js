const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Booking = require('./models/Booking');

async function runDebug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/elevatehubproject', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB for Debugging");

        // 1. DUMP ALL USERS
        const allUsers = await User.find({}, 'name email role');
        console.log(`\n--- ALL USERS (${allUsers.length}) ---`);
        allUsers.forEach(u => console.log(`[${u.role}] ${u.name} | ID: ${u._id}`));

        // 2. INSPECT BROKEN BOOKINGS
        const bookings = await Booking.find().sort({ updatedAt: -1 }).limit(10);
        console.log("\n--- Recent Bookings Analysis (Raw IDs) ---");

        for (const b of bookings) {
            console.log(`\nBooking ID: ${b._id} | Date: ${b.date}`);
            console.log(`- Student Ref ID: ${b.student}`);
            console.log(`- Mentor Ref ID: ${b.mentor}`);
            console.log(`- Status: ${b.status}`);

            // Check if student exists in the full list
            const studentUser = allUsers.find(u => u._id.toString() === b.student.toString());
            if (studentUser) {
                console.log(`  -> Student EXISTS: ${studentUser.name}`);

                // Check Student Profile
                const profile = await Student.findOne({ user: studentUser._id });
                if (profile) {
                    console.log(`  -> Profile Weak Topics: ${JSON.stringify(profile.weakTopics)}`);
                } else {
                    console.log(`  -> Student Profile MISSING`);
                }

            } else {
                console.log(`  -> Student USER NOT FOUND (ORPHANED ID)`);
            }
        }

    } catch (error) {
        console.error("Debug Failed:", error);
    } finally {
        setTimeout(() => mongoose.connection.close(), 1000);
    }
}

runDebug();
