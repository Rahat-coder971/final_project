const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Booking = require('./models/Booking');
const Roadmap = require('./models/Roadmap');

const TARGET_BOOKING_ID = '69944520a34f6bd0caff7cdc';
const TARGET_STUDENT_NAME = 'Rahat';

async function runDeepDive() {
    try {
        await mongoose.connect('mongodb://localhost:27017/elevatehubproject', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB for Deep Dive");

        // 1. Inspect the Booking
        console.log(`\n--- Inspecting Booking: ${TARGET_BOOKING_ID} ---`);
        let booking;
        try {
            booking = await Booking.findById(TARGET_BOOKING_ID);
        } catch (e) {
            console.log("Invalid ID format or not found.");
        }

        if (booking) {
            console.log(`Booking ID: ${booking._id}`);
            console.log(`Student ID: ${booking.student}`);
            console.log(`Status: ${booking.status}`);
            console.log(`Outcome: ${JSON.stringify(booking.outcome, null, 2)}`);
            console.log(`Roadmap ID: ${booking.roadmapId}`);
            console.log(`Milestone Index: ${booking.milestoneIndex}`);

            // 2. Inspect the Student
            console.log(`\n--- Inspecting Student (Ref: ${booking.student}) ---`);
            const studentUser = await User.findById(booking.student);

            // 3. Inspect Roadmap
            if (booking.roadmapId) {
                const roadmap = await Roadmap.findById(booking.roadmapId);
                if (roadmap) {
                    console.log(`\n--- Inspecting Linked Roadmap ---`);
                    const mIdx = booking.milestoneIndex;
                    console.log(`Milestone Index: ${mIdx}`);
                    if (roadmap.milestones && roadmap.milestones[mIdx]) {
                        const m = roadmap.milestones[mIdx];
                        console.log(`Milestone [${mIdx}] Status: ${m.status}`);
                        console.log(`Milestone [${mIdx}] Interview Status: ${m.interviewStatus}`);
                        console.log(`Milestone [${mIdx}] Linked Booking ID: ${m.bookingId}`); // CRITICAL CHECK
                        console.log(`Milestone [${mIdx}] Weak Concepts: ${JSON.stringify(m.weakConcepts)}`);

                        if (m.bookingId && m.bookingId.toString() !== booking._id.toString()) {
                            console.log(`WARNING: Roadmap is linked to a DIFFERENT Booking ID: ${m.bookingId}`);
                            // Should inspecting that other booking?
                            const otherBooking = await Booking.findById(m.bookingId);
                            console.log(`--- Inspecting The OTHER Booking (${m.bookingId}) ---`);
                            if (otherBooking) {
                                console.log(`Status: ${otherBooking.status}`);
                                console.log(`Outcome: ${JSON.stringify(otherBooking.outcome)}`);
                            } else {
                                console.log("Other booking NOT FOUND.");
                            }
                        }
                    }
                }
            }

        } else {
            console.log("Booking found null.");
        }

    } catch (error) {
        console.error("Deep Dive Failed:", error);
    } finally {
        setTimeout(() => mongoose.connection.close(), 1000);
    }
}

runDeepDive();
