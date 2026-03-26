const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Roadmap = require('./models/Roadmap');

async function runFix() {
    try {
        await mongoose.connect('mongodb://localhost:27017/elevatehubproject', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const studentName = "Rahat Husain khan";
        const mentorName = "mithin srinivs";

        const student = await User.findOne({ name: { $regex: studentName, $options: 'i' } });
        const mentor = await User.findOne({ name: { $regex: mentorName, $options: 'i' } });

        if (!student || !mentor) {
            console.error("Could not find Student or Mentor users to link.");
            console.log("Student:", student?._id);
            console.log("Mentor:", mentor?._id);
            return;
        }

        console.log(`Creating Booking between ${student.name} and ${mentor.name}...`);

        // Check for Roadmap
        const roadmap = await Roadmap.findOne({ student: student._id });
        let roadmapId = roadmap?._id;
        let milestoneIndex = 0;

        if (!roadmap) {
            console.log("Warning: Student has no Roadmap. Creating dummy booking without roadmap link (Grading might not update milestone status but will save outcome).");
        } else {
            roadmapId = roadmap._id;
            milestoneIndex = roadmap.currentMilestoneIndex || 0;
        }

        const newBooking = await Booking.create({
            student: student._id,
            mentor: mentor._id,
            date: new Date(), // Now
            status: 'confirmed', // Ready to grade
            meetingLink: 'https://meet.google.com/test-link',
            roadmapId: roadmapId,
            milestoneIndex: milestoneIndex
        });

        console.log("SUCCESS: Created New Booking!");
        console.log(`Booking ID: ${newBooking._id}`);
        console.log("Please ask the user to refresh their Mentor Dashboard (Upcoming Sessions).");

    } catch (error) {
        console.error("Fix Failed:", error);
    } finally {
        setTimeout(() => mongoose.connection.close(), 1000);
    }
}

runFix();
