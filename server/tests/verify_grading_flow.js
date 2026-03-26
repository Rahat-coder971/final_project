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
        const studentUser = await User.create({ name: 'Test Student', email: `student${Date.now()}@test.com`, password: '123', role: 'student' });
        const mentorUser = await User.create({ name: 'Test Mentor', email: `mentor${Date.now()}@test.com`, password: '123', role: 'mentor' });

        const studentProfile = await Student.create({ user: studentUser._id, roadmapProgress: 0, completedInterviews: 0 });

        const roadmap = await Roadmap.create({
            student: studentUser._id,
            title: 'Test Roadmap',
            goal: 'Testing',
            milestones: [
                { title: 'Milestone 1', status: 'active', interviewStatus: 'scheduled' },
                { title: 'Milestone 2', status: 'locked' }
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

        // Link Booking to Roadmap Milestone (as it would be in real flow)
        roadmap.milestones[0].bookingId = booking._id;
        await roadmap.save();

        console.log("Setup Complete. Booking ID:", booking._id);

        // 2. Execute completeInterview
        const req = mockReq(
            { score: 85, feedback: 'Great job!', mentorNotes: 'Good candidate', passed: true },
            { id: booking._id },
            { id: mentorUser._id, role: 'mentor' }
        );
        const res = mockRes();

        console.log("Executing completeInterview...");
        await completeInterview(req, res);

        // 3. Verify Results

        // A. Verify Response
        if (res.statusCode && res.statusCode !== 200) {
            console.error("FAILED: Controller returned status", res.statusCode, res.data);
            return;
        } else {
            console.log("Controller executed successfully.");
        }

        // B. Verify Booking Update
        const updatedBooking = await Booking.findById(booking._id);
        console.log("Booking Status:", updatedBooking.status);
        console.log("Booking Outcome:", updatedBooking.outcome);
        if (updatedBooking.status !== 'completed' || updatedBooking.outcome.score !== 85) {
            console.error("FAILED: Booking not updated correctly.");
        } else {
            console.log("PASSED: Booking updated.");
        }

        // C. Verify Roadmap Update (The Critical Fix)
        const updatedRoadmap = await Roadmap.findById(roadmap._id);
        const m1 = updatedRoadmap.milestones[0];
        console.log("Milestone 1 Status:", m1.status);
        console.log("Milestone 1 InterviewStatus:", m1.interviewStatus);
        console.log("Milestone 1 Score:", m1.interviewScore);
        console.log("Milestone 1 Feedback:", m1.interviewFeedback);

        if (m1.interviewScore !== 85 || m1.interviewFeedback !== 'Great job!') {
            console.error("FAILED: Roadmap Milestone missing score/feedback.");
        } else {
            console.log("PASSED: Roadmap Milestone has score/feedback.");
        }

        if (m1.interviewStatus !== 'passed') {
            console.error("FAILED: Roadmap Milestone status is incorrect (should be 'passed').");
        } else {
            console.log("PASSED: Roadmap Milestone status is 'passed'.");
        }

        // D. Verify Student Stats Update
        const updatedStudent = await Student.findOne({ user: studentUser._id });
        console.log("Student Interviews Completed:", updatedStudent.completedInterviews);
        console.log("Student Progress:", updatedStudent.roadmapProgress);

        if (updatedStudent.completedInterviews !== 1 || updatedStudent.roadmapProgress !== 50) { // 1/2 milestones = 50%
            console.error("FAILED: Student stats not updated correctly.");
        } else {
            console.log("PASSED: Student stats updated.");
        }

        // Cleanup
        await Booking.deleteMany({ _id: booking._id });
        await Roadmap.deleteMany({ _id: roadmap._id });
        await Student.deleteMany({ _id: studentProfile._id });
        await User.deleteMany({ _id: { $in: [studentUser._id, mentorUser._id] } });

        console.log("Test Cleanup Complete.");
        process.exit(0);

    } catch (error) {
        console.error("Verification Failed:", error.message);
        process.exit(1);
    }
}

runTest();
