const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Roadmap = require('../models/Roadmap');
const Booking = require('../models/Booking');

async function fixData() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/elevatehubproject', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        // 1. Find User
        const user = await User.findOne({ email: 'rahathusainkhan483@gmail.com' });
        if (!user) {
            console.log("User not found");
            return;
        }

        // 2. Find Roadmap
        const roadmap = await Roadmap.findOne({ student: user._id });
        if (!roadmap) {
            console.log("Roadmap not found");
            return;
        }

        console.log("Found Roadmap:", roadmap._id);

        let modifications = 0;

        // 3. Iterate through milestones and check for missing data
        for (let i = 0; i < roadmap.milestones.length; i++) {
            const m = roadmap.milestones[i];

            // If passed but missing score/feedback
            if (m.status === 'completed' && m.interviewStatus === 'passed' && !m.interviewScore) {
                console.log(`Milestone ${i + 1} is completed but missing score.`);

                // Find the booking for this milestone
                // We use roadmapId and milestoneIndex to be precise, or bookingId if available
                let booking;
                if (m.bookingId) {
                    booking = await Booking.findById(m.bookingId);
                }

                if (!booking) {
                    console.log("  Trying to find booking by roadmap/index...");
                    booking = await Booking.findOne({
                        student: user._id,
                        roadmapId: roadmap._id,
                        milestoneIndex: i,
                        status: 'completed'
                    }).sort({ date: -1 }); // Get latest
                }

                if (booking && booking.outcome) {
                    console.log("  Found Booking:", booking._id);
                    console.log("  Outcome:", booking.outcome);

                    m.interviewScore = booking.outcome.score;
                    m.interviewFeedback = booking.outcome.feedback;
                    modifications++;
                    console.log("  Updated Milestone with Booking Outcome.");
                } else {
                    console.log("  No completed booking found for this milestone.");
                }
            }
        }

        if (modifications > 0) {
            await roadmap.save();
            console.log(`Successfully updated ${modifications} milestones.`);
        } else {
            console.log("No modifications needed.");
        }

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixData();
