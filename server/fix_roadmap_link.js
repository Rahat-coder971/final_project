const mongoose = require('mongoose');
const Roadmap = require('./models/Roadmap');
const Booking = require('./models/Booking');

const TARGET_BOOKING_ID = '69944520a34f6bd0caff7cdc';
const MILESTONE_INDEX = 2;

async function runFix() {
    try {
        await mongoose.connect('mongodb://localhost:27017/elevatehubproject', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log("Connected to MongoDB for Roadmap Fix");

        // 1. Find the Booking to get student ID
        const booking = await Booking.findById(TARGET_BOOKING_ID);
        if (!booking) {
            console.error("Target Booking not found!");
            return;
        }
        console.log(`Found Booking for Student: ${booking.student}`);

        // 2. Find Roadmap
        const roadmap = await Roadmap.findOne({ student: booking.student });
        if (!roadmap) {
            console.error("Roadmap not found for student!");
            return;
        }

        console.log(`Found Roadmap: ${roadmap._id}`);

        if (roadmap.milestones[MILESTONE_INDEX]) {
            console.log(`Current Booking Link: ${roadmap.milestones[MILESTONE_INDEX].bookingId}`);
            console.log(`Current Status: ${roadmap.milestones[MILESTONE_INDEX].interviewStatus}`);

            // UPDATE LINK
            roadmap.milestones[MILESTONE_INDEX].bookingId = booking._id;
            roadmap.milestones[MILESTONE_INDEX].interviewStatus = 'scheduled';
            roadmap.milestones[MILESTONE_INDEX].status = 'active';

            // Clear previous results for a clean slate
            roadmap.milestones[MILESTONE_INDEX].interviewScore = undefined;
            roadmap.milestones[MILESTONE_INDEX].interviewFeedback = undefined;
            roadmap.milestones[MILESTONE_INDEX].weakConcepts = [];

            await roadmap.save();
            console.log("SUCCESS: Roadmap updated to link to new booking and reset status.");
        } else {
            console.error(`Milestone Index ${MILESTONE_INDEX} does not exist.`);
        }

    } catch (error) {
        console.error("Fix Failed:", error);
    } finally {
        setTimeout(() => mongoose.connection.close(), 1000);
    }
}

runFix();
