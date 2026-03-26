const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const User = require('./models/User');

dotenv.config();

const triggerRecovery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("MongoDB Connected");

        const nameQuery = "Rahat Husain Khan"; // Adjust casing if needed
        const user = await User.findOne({ name: new RegExp(nameQuery, 'i') });

        if (!user) {
            console.log("User not found.");
            process.exit();
        }

        const student = await Student.findOne({ user: user._id });
        if (!student) {
            console.log("Student not found.");
            process.exit();
        }

        console.log(`Activating Recovery Plan for ${user.name}...`);

        // Manually Construct a Plan
        student.recoveryPlan = {
            active: true,
            title: "Recovery: Node.js & Async Logic",
            weakAreas: ['Event Loop', 'Promises', 'Async/Await'],
            startDate: new Date(),
            lastActiveDate: new Date(),
            schedule: [
                {
                    day: 1,
                    topic: "Understanding the Event Loop",
                    subtopics: ["Call Stack", "Task Queue", "Microtasks"],
                    status: "unlocked",
                    score: 0
                },
                {
                    day: 2,
                    topic: "Promises Deep Dive",
                    subtopics: ["Creation", "Chaining", "Error Handling"],
                    status: "locked",
                    score: 0
                },
                {
                    day: 3,
                    topic: "Async/Await Patterns",
                    subtopics: ["Syntax", "Try/Catch", "Parallel Execution"],
                    status: "locked",
                    score: 0
                },
                {
                    day: 4,
                    topic: "Error Handling in Node",
                    subtopics: ["Sync vs Async Errors", "Custom Errors"],
                    status: "locked",
                    score: 0
                },
                {
                    day: 5,
                    topic: "Streams and Buffers",
                    subtopics: ["Readable", "Writable", "Piping"],
                    status: "locked",
                    score: 0
                },
                {
                    day: 6,
                    topic: "File System Operations",
                    subtopics: ["fs module", "Blocking vs Non-blocking"],
                    status: "locked",
                    score: 0
                },
                {
                    day: 7,
                    topic: "Final Integration Project",
                    subtopics: ["Building a robust API"],
                    status: "locked",
                    score: 0
                }
            ]
        };

        // Also ensure weakTopics are present
        if (!student.weakTopics || student.weakTopics.length === 0) {
            student.weakTopics = [
                { topic: 'Event Loop', source: 'mentor', missedQuestionsCount: 5, lastMissed: new Date() },
                { topic: 'Promises', source: 'mentor', missedQuestionsCount: 5, lastMissed: new Date() }
            ];
        }

        await student.save();
        console.log("SUCCESS: Recovery Plan Activated.");
        console.log("Please refresh the Performance Page.");

        process.exit();

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

triggerRecovery();
