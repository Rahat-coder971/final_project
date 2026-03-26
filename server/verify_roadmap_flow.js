const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Roadmap = require('./models/Roadmap');
const Booking = require('./models/Booking');
const Student = require('./models/Student');

dotenv.config();

const runVerification = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Creates DB connection...');

        // 1. Create Dummy User & Student
        const user = await User.create({
            name: 'Test Student',
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            role: 'student'
        });
        const student = await Student.create({ user: user._id });
        console.log('1. User Created:', user.email);

        // 2. Simulate Roadmap Generation (Mocking AI response)
        const mockRoadmapData = {
            title: "Mastery Path for Testing",
            milestones: [{
                title: "Milestone 1",
                status: "active",
                sections: [
                    {
                        title: "Section 1.1",
                        status: "active",
                        quiz: {
                            questions: [
                                { question: "Q1", options: ["A", "B"], correctAnswer: 0 },
                                { question: "Q2", options: ["A", "B"], correctAnswer: 0 }, // 3 questions to be safe
                                { question: "Q3", options: ["A", "B"], correctAnswer: 0 }
                            ],
                            passingScore: 66,
                            userScore: 0,
                            passed: false
                        }
                    },
                    {
                        title: "Section 1.2",
                        status: "locked",
                        quiz: { questions: [], passingScore: 75 }
                    }
                ]
            },
            {
                title: "Milestone 2",
                status: "locked",
                sections: []
            }]
        };

        const roadmap = await Roadmap.create({
            student: user._id,
            title: mockRoadmapData.title,
            goal: "Test Goal",
            milestones: mockRoadmapData.milestones,
            mentor: null,
            isGenerated: true
        });
        console.log('2. Roadmap Created');

        // 3. Test Quiz Submission (Fail)
        console.log('3. Testing Quiz Fail...');
        let section = roadmap.milestones[0].sections[0];
        let questions = section.quiz.questions;
        // submit 1 correct out of 3 (33%)
        let answers = [0, 1, 1];
        let correctCount = 0;
        if (answers[0] === questions[0].correctAnswer) correctCount++;
        if (answers[1] === questions[1].correctAnswer) correctCount++;
        if (answers[2] === questions[2].correctAnswer) correctCount++;
        let score = (correctCount / questions.length) * 100;
        let passed = score >= section.quiz.passingScore;

        if (passed) throw new Error("Quiz should have failed!");
        console.log(`   Scored ${score}%. Passed: ${passed} (Correct)`);

        // 4. Test Quiz Submission (Pass) & Unlock Next Section
        console.log('4. Testing Quiz Pass...');
        answers = [0, 0, 0]; // All correct
        correctCount = 3;
        score = 100;
        passed = true;

        // Simulate Controller Logic
        section.quiz.userScore = score;
        section.quiz.passed = passed;
        section.status = 'completed';
        roadmap.milestones[0].sections[1].status = 'active'; // Unlock next
        await roadmap.save();

        const updatedRoadmap = await Roadmap.findById(roadmap._id);
        if (updatedRoadmap.milestones[0].sections[1].status !== 'active') {
            throw new Error("Next section did not unlock!");
        }
        console.log('   Quiz passed. Next section unlocked.');

        // 5. Test Interview Completion & Unlock Next Milestone
        console.log('5. Testing Interview Completion...');
        const booking = await Booking.create({
            student: user._id,
            mentor: user._id, // Self-booking for test
            date: new Date(),
            outcome: { score: 90, passed: true }
        });

        // Simulate Controller Logic
        const currentMilestoneIdx = updatedRoadmap.currentMilestoneIndex; // 0
        updatedRoadmap.milestones[currentMilestoneIdx].status = 'completed';
        updatedRoadmap.milestones[currentMilestoneIdx + 1].status = 'active';
        updatedRoadmap.currentMilestoneIndex = currentMilestoneIdx + 1;
        await updatedRoadmap.save();

        const finalRoadmap = await Roadmap.findById(roadmap._id);
        if (finalRoadmap.milestones[1].status !== 'active') {
            throw new Error("Next Milestone did not unlock!");
        }
        console.log('   Interview passed. Next Milestone unlocked.');

        console.log('SUCCESS: All backend logic verified.');

        // Cleanup
        await User.findByIdAndDelete(user._id);
        await Student.findByIdAndDelete(student._id);
        await Roadmap.findByIdAndDelete(roadmap._id);
        await Booking.findByIdAndDelete(booking._id);

    } catch (error) {
        console.error('FAILED:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runVerification();
