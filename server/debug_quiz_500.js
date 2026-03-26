const mongoose = require('mongoose');
const Roadmap = require('./models/Roadmap');
require('dotenv').config();

const runReproduction = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const roadmapId = '698c9fdc557bee00c642fcd6';
        const milestoneIdx = 0;
        const sectionIdx = 0;
        const answers = [0, 1, 2, 0, 1]; // Dummy answers

        console.log(`Attempting to submit quiz for Roadmap: ${roadmapId}, M:${milestoneIdx}, S:${sectionIdx}`);

        const roadmap = await Roadmap.findById(roadmapId);
        if (!roadmap) {
            console.log('Roadmap not found!');
            return;
        }

        console.log('Roadmap found.');

        if (!roadmap.milestones || !roadmap.milestones[milestoneIdx]) {
            console.error('Milestone not found at index', milestoneIdx);
            return;
        }

        const section = roadmap.milestones[milestoneIdx].sections[sectionIdx];
        if (!section) {
            console.error('Section not found at index', sectionIdx);
            return;
        }

        console.log('Section found:', section.title);

        if (!section.quiz) {
            console.error('Quiz object missing in section!');
            return;
        }

        if (!section.quiz.questions) {
            console.error('Questions array missing in quiz!');
            return;
        }

        console.log(`Ref: quiz has ${section.quiz.questions.length} questions.`);

        // Simulate logic in controller
        const questions = section.quiz.questions;
        let correctCount = 0;
        questions.forEach((q, idx) => {
            // Potential crash point if q is undefined or answers[idx] is out of bounds (though JS usually handles undefined)
            if (answers[idx] === q.correctAnswer) correctCount++;
        });

        const score = (correctCount / questions.length) * 100;
        console.log(`Calculated Score: ${score}`);

    } catch (err) {
        console.error('Crash reproduced:', err);
    } finally {
        await mongoose.connection.close();
    }
};

runReproduction();
