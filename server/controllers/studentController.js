const Student = require('../models/Student');
const User = require('../models/User');
const { generateDailyQuiz } = require('./aiController');
const Roadmap = require('../models/Roadmap');

// @desc    Get current student profile
// @route   GET /api/students/me
// @access  Private (Student)
const getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id }).populate('user', 'name email');
        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const roadmap = await Roadmap.findOne({ student: req.user.id });

        // Transform skillLevels (Prioritize Roadmap Milestones as Skills)
        let skills = [];

        if (roadmap && roadmap.milestones && roadmap.milestones.length > 0) {
            skills = roadmap.milestones.map(m => {
                // Calculate Score: Strictly Quiz Averages for "Skill Breakdown"
                let score = 0;

                if (m.sections && m.sections.length > 0) {
                    // Filter sections that actually have quiz questions
                    const quizSections = m.sections.filter(s => s.quiz && s.quiz.questions && s.quiz.questions.length > 0);

                    if (quizSections.length > 0) {
                        const totalScore = quizSections.reduce((acc, s) => acc + (s.quiz.userScore || 0), 0);
                        score = Math.round(totalScore / quizSections.length);
                    }
                }

                return {
                    subject: m.title.split(':')[0], // Use main title part
                    A: score,
                    fullMark: 100,
                    status: m.status
                };
            });
        }

        // Fallback to manual skill levels if roadmap didn't yield skills (e.g. empty roadmap)
        if (skills.length === 0 && student.skillLevels) {
            student.skillLevels.forEach((level, subject) => {
                skills.push({ subject, A: level, fullMark: 100 });
            });
        }

        if (skills.length === 0) {
            // Default skills if empty
            skills.push(
                { subject: 'Coding', A: 0, fullMark: 100 },
                { subject: 'Design', A: 0, fullMark: 100 },
                { subject: 'Communication', A: 0, fullMark: 100 }
            );
        }

        // Comparison Engine Logic
        let comparison = {
            current: null,
            last: null
        };

        if (roadmap && roadmap.milestones) {
            const currentIdx = roadmap.currentMilestoneIndex;

            // Current (Doing)
            if (roadmap.milestones[currentIdx]) {
                comparison.current = {
                    title: roadmap.milestones[currentIdx].title,
                    status: roadmap.milestones[currentIdx].status === 'locked' ? 'Locked' : 'In Progress',
                    score: roadmap.milestones[currentIdx].interviewScore,
                    feedback: roadmap.milestones[currentIdx].interviewFeedback,
                    sentiment: roadmap.milestones[currentIdx].interviewSentiment,
                    focusArea: roadmap.milestones[currentIdx].interviewFocusArea,
                    interviewStatus: roadmap.milestones[currentIdx].interviewStatus
                };
            }

            // Last Completed (Done)
            // Perform a reverse search for the last 'passed' milestone
            const completedMilestones = roadmap.milestones.filter(m => m.interviewStatus === 'passed');
            const lastCompleted = completedMilestones.length > 0 ? completedMilestones[completedMilestones.length - 1] : null;

            if (lastCompleted) {
                comparison.last = {
                    title: lastCompleted.title,
                    score: lastCompleted.interviewScore || 0,
                    feedback: lastCompleted.interviewFeedback || "No feedback",
                    sentiment: lastCompleted.interviewSentiment,
                    focusArea: lastCompleted.interviewFocusArea,
                    date: lastCompleted.completedAt || null // Assuming we might add completedAt, or just use interview date
                };
            }
        }

        // Growth Data from Snapshots
        const growth = student.snapshots && student.snapshots.length > 0
            ? student.snapshots.map(s => ({
                month: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                score: s.progress
            }))
            : [{ month: 'Start', score: 0 }, { month: 'Now', score: student.roadmapProgress || 0 }];

        const readiness = (roadmap && roadmap.milestones && roadmap.milestones.length > 0)
            ? Math.round((roadmap.milestones.filter(m => m.status === 'completed').length / roadmap.milestones.length) * 100)
            : (student.roadmapProgress || 0);

        // Detailed History for Table
        const history = (roadmap && roadmap.milestones) ? roadmap.milestones.map((m, idx) => ({
            milestoneTitle: m.title,
            status: m.status,
            score: m.interviewScore,
            feedback: m.interviewFeedback,
            sentiment: m.interviewSentiment,
            focusArea: m.interviewFocusArea,
            date: m.bookingId ? m.bookingId.date : null, // ideally populate booking date
            interviewStatus: m.interviewStatus
        })) : [];

        const profile = {
            ...student.toObject(),
            skills,
            growth,
            comparison, // New Field
            history,    // New Field for Table
            readiness // Dynamic Readiness
        };

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get specific student profile (for Mentors)
// @route   GET /api/students/:id
// @access  Private (Mentor)
const getStudentById = async (req, res) => {
    try {
        // Try finding by User ID first (most common case from frontend)
        let student = await Student.findOne({ user: req.params.id }).populate('user', 'name email');

        if (!student) {
            // Fallback: Try finding by Document ID
            try {
                student = await Student.findById(req.params.id).populate('user', 'name email');
            } catch (err) {
                // Ignore cast error if params.id wasn't a valid ObjectId for findById
            }
        }

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Fetch Roadmap FIRST to calculate dynamic skills and readiness
        const roadmap = await Roadmap.findOne({ student: student.user._id });

        // Transform skillLevels (Prioritize Roadmap Milestones as Skills)
        let skills = [];

        if (roadmap && roadmap.milestones && roadmap.milestones.length > 0) {
            skills = roadmap.milestones.map(m => {
                // Calculate Score: Strictly Quiz Averages for "Skill Breakdown"
                let score = 0;

                if (m.sections && m.sections.length > 0) {
                    // Filter sections that actually have quiz questions
                    const quizSections = m.sections.filter(s => s.quiz && s.quiz.questions && s.quiz.questions.length > 0);

                    if (quizSections.length > 0) {
                        const totalScore = quizSections.reduce((acc, s) => acc + (s.quiz.userScore || 0), 0);
                        score = Math.round(totalScore / quizSections.length);
                    }
                }

                return {
                    subject: m.title.split(':')[0], // Use main title part
                    A: score,
                    fullMark: 100,
                    status: m.status
                };
            });
        }

        // Fallback to manual skill levels if roadmap didn't yield skills
        if (skills.length === 0 && student.skillLevels) {
            student.skillLevels.forEach((level, subject) => {
                skills.push({ subject, A: level, fullMark: 100 });
            });
        }

        if (skills.length === 0) {
            skills.push(
                { subject: 'Coding', A: 0, fullMark: 100 },
                { subject: 'Design', A: 0, fullMark: 100 },
                { subject: 'Communication', A: 0, fullMark: 100 }
            );
        }

        // Comparison Engine Logic (Synced with getStudentProfile)
        let comparison = {
            current: null,
            last: null
        };

        if (roadmap && roadmap.milestones) {
            const currentIdx = roadmap.currentMilestoneIndex;

            // Current (Doing)
            if (roadmap.milestones[currentIdx]) {
                comparison.current = {
                    title: roadmap.milestones[currentIdx].title,
                    status: roadmap.milestones[currentIdx].status === 'locked' ? 'Locked' : 'In Progress',
                    score: roadmap.milestones[currentIdx].interviewScore,
                    feedback: roadmap.milestones[currentIdx].interviewFeedback,
                    sentiment: roadmap.milestones[currentIdx].interviewSentiment,
                    focusArea: roadmap.milestones[currentIdx].interviewFocusArea,
                    interviewStatus: roadmap.milestones[currentIdx].interviewStatus
                };
            }

            // Last Completed (Done)
            const completedMilestones = roadmap.milestones.filter(m => m.interviewStatus === 'passed');
            const lastCompleted = completedMilestones.length > 0 ? completedMilestones[completedMilestones.length - 1] : null;

            if (lastCompleted) {
                comparison.last = {
                    title: lastCompleted.title,
                    score: lastCompleted.interviewScore || 0,
                    feedback: lastCompleted.interviewFeedback || "No feedback",
                    sentiment: lastCompleted.interviewSentiment,
                    focusArea: lastCompleted.interviewFocusArea,
                    date: lastCompleted.completedAt || null
                };
            }
        }

        const readiness = (roadmap && roadmap.milestones && roadmap.milestones.length > 0)
            ? Math.round((roadmap.milestones.filter(m => m.status === 'completed').length / roadmap.milestones.length) * 100)
            : (student.roadmapProgress || 0);

        const growth = student.snapshots && student.snapshots.length > 0
            ? student.snapshots.map(s => ({
                month: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                score: s.progress
            }))
            : [{ month: 'Start', score: 0 }, { month: 'Now', score: readiness }];

        const profile = {
            ...student.toObject(),
            skills: skills,
            growth: growth,
            comparison, // Synced Field
            readiness: readiness
        };

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update student skills (for Mentors)
// @route   PUT /api/students/:id/skills
// @access  Private (Mentor)
const updateStudentSkills = async (req, res) => {
    try {
        const { skills } = req.body; // Expects object { "React": 80, "Design": 50 }

        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update skills map
        if (skills) {
            const sanitizedSkills = {};
            for (const [key, value] of Object.entries(skills)) {
                const safeKey = key.replace(/\./g, '_');
                sanitizedSkills[safeKey] = value;
            }
            student.skillLevels = sanitizedSkills;
        }

        // Update Mentor Advice
        if (req.body.mentorPrepAdvice !== undefined) {
            student.mentorPrepAdvice = req.body.mentorPrepAdvice;
        }

        await student.save();
        res.json(student);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a snapshot of student progress
// @route   Internal / Helper
const createSnapshot = async (userId) => {
    try {
        const student = await Student.findOne({ user: userId });
        if (!student) return;

        // Simply push current state
        student.snapshots.push({
            date: new Date(),
            progress: student.roadmapProgress,
            skillLevels: student.skillLevels
        });

        // Limit snapshots to last 20 to prevent bloat? For now keep all.
        await student.save();
        console.log(`Snapshot created for user ${userId}`);
    } catch (error) {
        console.error("Snapshot creation failed:", error);
    }
};

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
        res.status(500).json({
            message: 'Server error',
            error: error.message,
            stack: error.stack,
            trace: 'Failed inside getDailyQuiz catch block'
        });
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

// @desc    Debug Endpoint
// @route   GET /api/students/test/debug
const testDebug = (req, res) => {
    res.json({ message: 'Debug endpoint works', time: new Date() });
};

// @desc    Get Current Recovery Challenge Status
// @route   GET /api/students/recovery-challenge
// @access  Private (Student)
const getRecoveryChallenge = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        if (!student.recoveryPlan || !student.recoveryPlan.active) {
            return res.json({ active: false });
        }

        res.json({
            active: true,
            title: student.recoveryPlan.title,
            startDate: student.recoveryPlan.startDate,
            schedule: student.recoveryPlan.schedule.map(d => ({
                day: d.day,
                topic: d.topic,
                subtopics: d.subtopics,
                status: d.status,
                score: d.score
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Start a specific day of the Recovery Challenge (Generate Quiz)
// @route   POST /api/students/recovery-challenge/start-day
// @access  Private
const startRecoveryDay = async (req, res) => {
    try {
        const { day } = req.body;
        const student = await Student.findOne({ user: req.user.id });

        if (!student || !student.recoveryPlan.active) {
            return res.status(400).json({ message: 'No active recovery challenge.' });
        }

        const dayPlan = student.recoveryPlan.schedule.find(d => d.day === day);
        if (!dayPlan) return res.status(404).json({ message: 'Invalid day.' });

        if (dayPlan.status === 'locked') {
            return res.status(403).json({ message: 'This day is locked. Complete previous days first.' });
        }

        // Logic: Generate Quiz for this specific Day's Topic
        // We'll reuse/adapt generateDailyQuiz logic or create a specific prompt
        console.log(`[Recovery] Generating quiz for Day ${day}: ${dayPlan.topic}`);

        // Using Gemini to generate SPECIFIC quiz
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Create a 5-question multiple-choice quiz for: "${dayPlan.topic}".
            Subtopics to cover: ${dayPlan.subtopics.join(', ')}.
            Difficulty: Intermediate.
            
            Format: JSON Array ONLY.
            [{"question": "...", "options": ["..."], "correctAnswer": 0, "topic": "..."}]
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const quiz = JSON.parse(jsonString);

        // We don't save this to 'dailyQuiz' to avoid overwriting the streak quiz.
        // We just return it. The frontend will handle the "Quiz Mode".
        // BUT we need to verify answers later. So strictly, we should save it somewhere? 
        // Let's repurpose 'dailyQuiz' TEMPORARILY or just trust the client for now (Not secure but faster).
        // BETTER: Save to 'dailyQuiz' but mark it as type='recovery'.

        student.dailyQuiz = {
            date: new Date(),
            questions: quiz,
            completed: false,
            type: 'recovery', // Marker (if we add schema support later, for now just implicit)
            dayIndex: day // Store which day this is for
        };
        await student.save();

        res.json({ questions: quiz });

    } catch (error) {
        console.error("Start Recovery Day Failed:", error);
        res.status(500).json({ message: 'Failed to generate recovery quiz.' });
    }
};

// @desc    Submit Recovery Quiz
// @route   POST /api/students/recovery-challenge/submit-day
const submitRecoveryDay = async (req, res) => {
    try {
        const { day, answers } = req.body;
        const student = await Student.findOne({ user: req.user.id });

        if (!student || !student.recoveryPlan.active) return res.status(400).json({ message: 'No active plan.' });

        const dayPlan = student.recoveryPlan.schedule.find(d => d.day === day);
        if (!dayPlan) return res.status(404).json({ message: 'Day not found.' });

        // Score Calculation (Using saved dailyQuiz)
        // Ensure the saved quiz corresponds to this request
        if (!student.dailyQuiz || student.dailyQuiz.completed) {
            // Edge case: if they reload. For MVP let's assume valid flow.
        }

        const quiz = student.dailyQuiz.questions;
        let score = 0;
        quiz.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) score++;
        });

        const percentage = Math.round((score / quiz.length) * 100);
        const passed = percentage >= 60; // 60% Passing for Recovery Steps

        // Update Scheule
        dayPlan.score = percentage;

        if (passed) {
            dayPlan.status = 'completed';
            dayPlan.completedAt = new Date();

            // Unlock Next Day
            const nextDay = student.recoveryPlan.schedule.find(d => d.day === day + 1);
            if (nextDay) {
                nextDay.status = 'unlocked';
            } else {
                // All days done?
                const allDone = student.recoveryPlan.schedule.every(d => d.status === 'completed');
                if (allDone) {
                    student.recoveryPlan.active = false; // Challenge Complete!
                    // Maybe add a reward/badge here
                }
            }
        }

        student.dailyQuiz.completed = true; // Mark quiz done
        await student.save();

        res.json({
            passed,
            score: percentage,
            message: passed ? 'Great job! Next day unlocked.' : 'Keep practicing. Try again tomorrow.',
            nextDayUnlocked: passed && student.recoveryPlan.active
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getStudentProfile, getStudentById, updateStudentSkills, createSnapshot, getDailyQuiz, submitDailyQuiz, testDebug, getRecoveryChallenge, startRecoveryDay, submitRecoveryDay };