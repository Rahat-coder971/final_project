const mongoose = require('mongoose');
const Student = require('./models/Student');
const Roadmap = require('./models/Roadmap');
const User = require('./models/User');
require('dotenv').config();

const verifyPerformanceTracker = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // 1. Find a student
        const student = await Student.findOne().populate('user');
        if (!student) {
            console.log("No student found");
            return;
        }
        console.log(`Testing with Student: ${student.user.name} (${student.user.email})`);

        // 2. Update Mentor Prep Advice
        const advice = "Focus on Async/Await patterns for the next interview.";
        student.mentorPrepAdvice = advice;
        await student.save();
        console.log("Updated mentorPrepAdvice.");

        const reloadedStudent = await Student.findById(student._id);
        if (reloadedStudent.mentorPrepAdvice === advice) {
            console.log("SUCCESS: mentorPrepAdvice persisted correctly.");
        } else {
            console.error("FAIL: mentorPrepAdvice mismatch.", reloadedStudent.mentorPrepAdvice);
        }

        // 3. Find Roadmap and Update Interview Feedback
        const roadmap = await Roadmap.findOne({ student: student.user._id });
        if (!roadmap) {
            console.log("No roadmap found for student");
            return;
        }

        if (roadmap.milestones.length > 0) {
            // Update first milestone with interview data
            roadmap.milestones[0].interviewFeedback = "Great communication skills, demonstrated solid understanding of basic loops.";
            roadmap.milestones[0].interviewScore = 88;
            roadmap.milestones[0].interviewStatus = 'passed';

            await roadmap.save();
            console.log("Updated Milestone 0 with interview data.");

            const reloadedRoadmap = await Roadmap.findById(roadmap._id);
            if (reloadedRoadmap.milestones[0].interviewScore === 88) {
                console.log("SUCCESS: Milestone interview data persisted.");
            } else {
                console.error("FAIL: Milestone interview data mismatch.");
            }
        } else {
            console.log("Roadmap has no milestones to test.");
        }

        // 4. Test AI Summary Endpoint (Mock call or check if controller accessible)
        // Since this is a script, we can't easily call the express route without starting server, 
        // but we verify the models are working.

    } catch (err) {
        console.error("Verification Failed:", err);
    } finally {
        await mongoose.connection.close();
    }
};

verifyPerformanceTracker();
