const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Mentor = require('../models/Mentor');
const Roadmap = require('../models/Roadmap');
const Booking = require('../models/Booking');
const { completeInterview } = require('../controllers/bookingController');

// Mock Request/Response objects
const mockReq = (body = {}, params = {}, user = {}) => ({
    body,
    params,
    user
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function runTest() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ionic-orbit', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB for Testing");

        // 1. Setup Data
        const studentUser = await User.create({ name: 'Weakness Tester', email: `weakness${Date.now()}@test.com`, password: '123', role: 'student' });
        const mentorUser = await User.create({ name: 'Test Mentor', email: `mentor${Date.now()}@test.com`, password: '123', role: 'mentor' });

        const studentProfile = await Student.create({ user: studentUser._id, roadmapProgress: 0, completedInterviews: 0, weakTopics: [] });

        const roadmap = await Roadmap.create({
            student: studentUser._id,
            title: 'Test Roadmap',
            goal: 'Testing',
            milestones: [
                { title: 'Milestone 1', status: 'active', interviewStatus: 'scheduled' }
            ]
        });

        const booking = await Booking.create({
            student: studentUser._id,
            mentor: mentorUser._id,
            date: new Date(),
            roadmapId: roadmap._id,
            milestoneIndex: 0,
            status: 'pending'
        });

        // Link Booking
        roadmap.milestones[0].bookingId = booking._id;
        await roadmap.save();

        console.log("Setup Complete. Booking ID:", booking._id);

        // 2. Execute completeInterview with Weak Concepts
        const weakConceptsInput = ['React Hooks', 'Async/Await Pattern'];

        const req = mockReq(
            {
                score: 85,
                feedback: 'Good work but needs improvement on hooks.',
                mentorNotes: 'Solid',
                passed: true,
                weakConcepts: weakConceptsInput
            },
            { id: booking._id },
            { id: mentorUser._id, role: 'mentor' }
        );
        const res = mockRes();

        console.log("Executing completeInterview with Weak Concepts:", weakConceptsInput);
        await completeInterview(req, res);

        // 3. Verify Results
        if (res.statusCode && res.statusCode !== 200) {
            console.error("FAILED: Controller returned status", res.statusCode, res.data);
            process.exit(1);
        }

        // A. Verify Student Weak Concepts
        const updatedStudent = await Student.findOne({ user: studentUser._id });
        console.log("Student Weak Topics:", JSON.stringify(updatedStudent.weakTopics, null, 2));

        const hasReactHooks = updatedStudent.weakTopics.some(t => t.topic === 'React Hooks' && t.source === 'mentor');
        const hasAsync = updatedStudent.weakTopics.some(t => t.topic === 'Async/Await Pattern' && t.source === 'mentor');

        if (hasReactHooks && hasAsync) {
            console.log("PASSED: Student profile updated with Weak Concepts.");
        } else {
            console.error("FAILED: Weak concepts NOT found in student profile.");
            process.exit(1);
        }

        // B. Verify Roadmap Milestone has them too (history)
        const updatedRoadmap = await Roadmap.findById(roadmap._id);
        const milestone = updatedRoadmap.milestones[0];
        console.log("Roadmap Milestone Weak Concepts:", milestone.weakConcepts);

        if (milestone.weakConcepts.includes('React Hooks')) {
            console.log("PASSED: Roadmap Milestone history updated.");
        } else {
            console.error("FAILED: Roadmap Milestone missing weak concepts.");
        }

        // Cleanup
        await Booking.deleteMany({ _id: booking._id });
        await Roadmap.deleteMany({ _id: roadmap._id });
        await Student.deleteMany({ _id: studentProfile._id });
        await User.deleteMany({ _id: { $in: [studentUser._id, mentorUser._id] } });

        console.log("Test Cleanup Complete.");
        process.exit(0);

    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
}

runTest();
