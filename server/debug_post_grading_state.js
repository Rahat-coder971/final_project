const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Booking = require('./models/Booking');
const Roadmap = require('./models/Roadmap');

const TARGET_BOOKING_ID = '69944520a34f6bd0caff7cdc';

async function runDebug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/elevatehubproject', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB");

        // 1. Check Booking Status & Outcome
        const booking = await Booking.findById(TARGET_BOOKING_ID);
        if (booking) {
            console.log(`\n--- Booking Status: ${booking.status} ---`);
            console.log(`Outcome: ${JSON.stringify(booking.outcome, null, 2)}`);
        } else {
            console.log("Booking NOT FOUND.");
        }

        // 2. Check Student Profile Weak Topics
        if (booking && booking.student) {
            const student = await Student.findOne({ user: booking.student });
            console.log(`\n--- Student Profile ---`);
            if (student) {
                console.log(`Weak Topics: ${JSON.stringify(student.weakTopics, null, 2)}`);
            } else {
                console.log("Student Profile NOT FOUND.");
            }
        }

        // 3. Check Roadmap (Just in case)
        if (booking && booking.student) {
            const roadmap = await Roadmap.findOne({ student: booking.student });
            if (roadmap) {
                const m = roadmap.milestones.find(m => m.bookingId && m.bookingId.toString() === booking._id.toString());
                if (m) {
                    console.log(`\n--- Roadmap Milestone ---`);
                    console.log(`Status: ${m.status}`);
                    console.log(`Interview Status: ${m.interviewStatus}`);
                    console.log(`Weak Concepts (in Roadmap): ${JSON.stringify(m.weakConcepts)}`);
                } else {
                    console.log("\nNo Milestone linked to this booking id directly found in Roadmap.");
                }
            }
        }

    } catch (error) {
        console.error("Debug Failed:", error);
    } finally {
        setTimeout(() => mongoose.connection.close(), 1000);
    }
}

runDebug();
