const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Roadmap = require('./models/Roadmap');
const Booking = require('./models/Booking');

dotenv.config();

const debugPerformance = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("MongoDB Connected");

        // 1. Find User
        const nameQuery = "Rahat Husain Khan"; // Adjust casing if needed
        const user = await User.findOne({ name: new RegExp(nameQuery, 'i') });

        if (!user) {
            console.log("User not found: " + nameQuery);
            const allUsers = await User.find({}).limit(5);
            console.log("Available Users:", allUsers.map(u => u.name));
            process.exit();
        }
        console.log(`\nUser Found: ${user.name} (${user._id})`);

        // 2. Fetch Student Profile
        const student = await Student.findOne({ user: user._id });
        if (!student) {
            console.log("Student Profile NOT FOUND.");
        } else {
            console.log("Student Profile Found.");
            console.log("- Skills:", student.skillLevels);
            console.log("- Weak Topics:", student.weakTopics);
            console.log("- Recovery Plan Active:", student.recoveryPlan?.active);
        }

        // 3. Fetch Roadmap
        const roadmap = await Roadmap.findOne({ student: user._id });
        if (!roadmap) {
            console.log("Roadmap NOT FOUND.");
        } else {
            console.log("Roadmap Found.");
            console.log("- Milestones:", roadmap.milestones.length);
            console.log("- Current Index:", roadmap.currentMilestoneIndex);
        }

        // 4. Simulate Analytics (Needs Attention)
        console.log("\n--- Simulating Analytics 'Needs Attention' ---");
        let needsAttention = [];

        // A. From Student Weak Topics
        if (student && student.weakTopics && student.weakTopics.length > 0) {
            needsAttention = student.weakTopics.map(t => ({
                topic: t.topic,
                source: 'Quiz Performance',
                status: 'Needs Practice'
            }));
        }

        // B. From Recent Booking (Fallback)
        const latestBooking = await Booking.findOne({ student: user._id }).sort({ _id: -1 });
        if (latestBooking) {
            console.log(`Latest Booking: ${latestBooking.date}, Outcome: ${latestBooking.outcome ? (latestBooking.outcome.passed ? 'PASS' : 'FAIL') : 'Pending'}`);
            if (latestBooking.outcome && !latestBooking.outcome.passed) {
                console.log("- Focus Area String:", latestBooking.outcome.focusArea);
                console.log("- Weak Concepts Array:", latestBooking.outcome.weakConcepts);
            }
        } else {
            console.log("No Bookings found.");
        }

        console.log("\nFinal Needs Attention List (Simulated):", needsAttention);

        process.exit();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

debugPerformance();
