
// @desc    Get Daily Adaptive Quiz
// @route   GET /api/students/daily-quiz
// @access  Private (Student)
const getDailyQuiz = async (req, res) => {
    try {
        let student = await Student.findOne({ user: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check Cache
        if (student.dailyQuiz && student.dailyQuiz.date) {
            const quizDate = new Date(student.dailyQuiz.date);
            quizDate.setHours(0, 0, 0, 0);

            if (quizDate.getTime() === today.getTime() && student.dailyQuiz.questions.length > 0) {
                console.log(`[DailyQuiz] Verified cache hit. Returning existing quiz.`);
                return res.json({
                    completed: student.dailyQuiz.completed,
                    questions: student.dailyQuiz.completed ? [] : student.dailyQuiz.questions.map(q => ({
                        question: q.question,
                        options: q.options,
                        topic: q.topic,
                        _id: q._id // Mongoose might add this
                    }))
                });
            }
        }

        // Generate New Quiz
        console.log(`[DailyQuiz] Generating new quiz...`);
        const Roadmap = require('../models/Roadmap');
        const roadmap = await Roadmap.findOne({ student: req.user.id });

        const questions = await generateDailyQuiz(student, roadmap);

        student.dailyQuiz = {
            date: new Date(),
            questions: questions,
            completed: false
        };

        await student.save();

        res.json({
            completed: false,
            questions: questions.map(q => ({
                question: q.question,
                options: q.options,
                topic: q.topic
            }))
        });

    } catch (error) {
        console.error("Get Daily Quiz Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Submit Daily Quiz
// @route   POST /api/students/daily-quiz
// @access  Private (Student)
const submitDailyQuiz = async (req, res) => {
    try {
        const { answers } = req.body; // Array of indices: [0, 2, 1, 3, 0]
        const student = await Student.findOne({ user: req.user.id });

        if (!student || !student.dailyQuiz || student.dailyQuiz.completed) {
            return res.status(400).json({ message: 'No active quiz found or already completed.' });
        }

        const quiz = student.dailyQuiz.questions;
        let score = 0;
        let results = [];

        quiz.forEach((q, idx) => {
            const isCorrect = answers[idx] === q.correctAnswer;
            if (isCorrect) score++;

            results.push({
                question: q.question,
                isCorrect,
                correctAnswer: q.options[q.correctAnswer],
                userAnswer: q.options[answers[idx]]
            });

            // Update Weak Topics
            if (!isCorrect) {
                const existingTopic = student.weakTopics.find(t => t.topic === q.topic);
                if (existingTopic) {
                    existingTopic.missedQuestionsCount += 1;
                    existingTopic.lastMissed = new Date();
                } else {
                    student.weakTopics.push({
                        topic: q.topic,
                        missedQuestionsCount: 1,
                        lastMissed: new Date(),
                        source: 'ai'
                    });
                }
            } else {
                // Decay weakness if correct? 
                // For now, let's just not increment. Ideally we decrease count.
                const existingTopic = student.weakTopics.find(t => t.topic === q.topic);
                if (existingTopic && existingTopic.missedQuestionsCount > 0) {
                    existingTopic.missedQuestionsCount -= 1;
                }
            }
        });

        student.dailyQuiz.completed = true;
        // Mark student as "active" today?
        // Add streak logic here if needed.

        await student.save();

        res.json({
            score,
            total: quiz.length,
            results
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
