const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Roadmap = require('../models/Roadmap');

async function checkPerformance() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/elevatehubproject', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        // Try exact match
        let user = await User.findOne({ email: 'rahathusainkhan483@gmail.com' });

        if (!user) {
            console.log("Exact match not found. Trying case-insensitive regex...");
            user = await User.findOne({ email: { $regex: new RegExp('^rahathusainkhan483@gmail.com$', 'i') } });
        }

        if (!user) {
            console.log("User still not found. Listing all users:");
            const allUsers = await User.find({}, 'name email role');
            allUsers.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));

            // Try to find by name "Rahat" as fallback
            user = await User.findOne({ name: /Rahat/i });
            if (user) console.log(`Found user by name match: ${user.name} (${user.email})`);
        } else {
            console.log("User Found:", user.name, user._id);
        }

        if (!user) {
            console.log("Could not identify the target user.");
            process.exit(0);
        }

        // Check Student Profile
        const student = await Student.findOne({ user: user._id });
        if (!student) {
            console.log("Student Profile not found");
        } else {
            console.log("\n--- Student Profile ---");
            console.log(`ID: ${student._id}`);
            console.log(`Roadmap Progress: ${student.roadmapProgress}%`);
            console.log(`Completed Interviews: ${student.completedInterviews}`);
            // console.log("Skill Levels:", student.skillLevels);
        }

        // Check Roadmap
        const roadmap = await Roadmap.findOne({ student: user._id });
        if (!roadmap) {
            console.log("Roadmap not found");
        } else {
            console.log("\n--- Roadmap Milestones ---");
            console.log(`Roadmap ID: ${roadmap._id}`);
            roadmap.milestones.forEach((m, idx) => {
                const statusIcon = m.status === 'completed' ? '[x]' : m.status === 'active' ? '[>]' : '[ ]';
                console.log(`${statusIcon} Milestone ${idx + 1}: ${m.title}`);
                console.log(`    Status: ${m.status}`);
                console.log(`    Interview Status: ${m.interviewStatus}`);
                console.log(`    Score: ${m.interviewScore}`);
                console.log(`    Feedback: "${m.interviewFeedback || '(none)'}"`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPerformance();
