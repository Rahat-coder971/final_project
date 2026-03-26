const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const OpenAI = require('openai');
const Student = require('../models/Student');
const Roadmap = require('../models/Roadmap');
const MeetingNote = require('../models/MeetingNote');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const interfazeClient = new OpenAI({
    apiKey: process.env.INTERFAZE_API_KEY,
    baseURL: 'https://api.interfaze.ai/v1'
});

// LangChain Setup
const chatModel = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    maxOutputTokens: 2048,
    apiKey: process.env.GEMINI_API_KEY,
});

// @desc    Summarize YouTube Video
// @route   POST /api/ai/summarize-video
// @access  Private
const summarizeYouTubeVideo = async (req, res) => {
    try {
        const { transcript } = req.body;
        if (!transcript) return res.status(400).json({ message: 'Transcript required' });

        const response = await chatModel.invoke([
            new SystemMessage("You are an expert educational AI assistant. Your goal is to summarize video transcripts concisely."),
            new HumanMessage(`
                Summarize the following YouTube video transcript in a concise, bulleted format. 
                Highlight the key takeaways and actionable insights.
                
                Transcript:
                "${transcript.substring(0, 30000)}" 
            `),
        ]);

        res.json({ summary: response.content });
    } catch (error) {
        console.error("Summary Error:", error);
        res.status(500).json({ message: 'Failed to summarize video' });
    }
};

// @desc    Generate a professional performance summary
// @route   POST /api/ai/performance-summary
// @access  Private
const generatePerformanceSummary = async (req, res) => {
    try {
        const studentId = req.body.studentId || req.user._id;

        // Fetch Data
        const studentProfile = await Student.findOne({ user: studentId });
        const roadmap = await Roadmap.findOne({ student: studentId });

        if (!studentProfile || !roadmap) {
            return res.status(404).json({ message: 'Student data incomplete for analysis.' });
        }

        // Prepare Context (simplified for brevity)
        const skills = studentProfile.skillLevels ? Object.fromEntries(studentProfile.skillLevels) : {};
        const completedMilestones = roadmap.milestones.filter(m => m.status === 'completed').length;
        const totalMilestones = roadmap.milestones.length;

        // Calculate Quiz Average
        let totalScore = 0;
        let count = 0;
        roadmap.milestones.forEach(m => {
            m.sections.forEach(s => {
                if (s.quiz && s.quiz.passed) {
                    totalScore += s.quiz.userScore;
                    count++;
                }
            });
        });
        const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

        const context = `
            Role: Aspiring Developer in ${roadmap.title}
            Progress: ${completedMilestones}/${totalMilestones} Milestones.
            Avg Quiz Score: ${avgScore}%
            Skills: ${JSON.stringify(skills)}
            Mentor Advice: "${studentProfile.mentorPrepAdvice || 'None'}"
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `
            Act as a Senior Technical Mentor. Analyze this student data and write a concise, professional 2-sentence summary of their current standing.
            Focus on strengths and one area for growth.
            Data: ${context}
        `;

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        res.json({ summary });

    } catch (error) {
        console.error("AI Summary Generation Failed:", error);
        res.status(500).json({ message: 'Failed to generate summary' });
    }
};



// @desc    Generate AI Coach Feedback
// @route   POST /api/ai/coach
// @access  Private
const generateCoachFeedback = async (req, res) => {
    try {
        const studentId = req.user._id;

        // Fetch Data
        const studentProfile = await Student.findOne({ user: studentId });
        const Roadmap = require('../models/Roadmap'); // Ensure loaded
        const roadmap = await Roadmap.findOne({ student: studentId });

        if (!studentProfile || !roadmap) {
            return res.status(404).json({ message: 'Student data incomplete for analysis.' });
        }

        // Check for existing Daily Insight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (studentProfile.dailyInsight && studentProfile.dailyInsight.date) {
            const insightDate = new Date(studentProfile.dailyInsight.date);
            insightDate.setHours(0, 0, 0, 0);

            if (insightDate.getTime() === today.getTime() && studentProfile.dailyInsight.text) {
                console.log(`[AICoach] Returning cached insight for student ${studentId}`);
                return res.json({ advice: studentProfile.dailyInsight.text });
            }
        }

        // Prepare Analysis Context
        const skills = studentProfile.skillLevels ? Object.fromEntries(studentProfile.skillLevels) : {};

        // Get last completed interview details
        const completedMilestones = roadmap.milestones.filter(m => m.interviewStatus === 'passed');
        const lastMilestone = completedMilestones.length > 0 ? completedMilestones[completedMilestones.length - 1] : null;

        const lastInterviewContext = lastMilestone ? `
            Last Interview: ${lastMilestone.title}
            Score: ${lastMilestone.interviewScore}%
            Mentor Feedback: "${lastMilestone.interviewFeedback}"
        ` : "No interviews completed yet.";

        const context = `
            Role: Aspiring Developer
            Progress: ${studentProfile.roadmapProgress}%
            Skills: ${JSON.stringify(skills)}
            ${lastInterviewContext}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
            Act as a supportive but honest Technical Career Coach. 
            Analyze this student's data and provide 2-3 sentences of specific, actionable advice.
            
            Guidelines:
            - Acknowledge their strengths based on high scores/skills.
            - Identify a specific weak area (lowest score/skill or mentor feedback) and suggest a fix.
            - Be direct and encouraging.
            - Format: Plain text, no markdown headers.
            
            Student Data: ${context}
        `;

        const result = await model.generateContent(prompt);
        const advice = result.response.text();

        // Save to Student Profile
        studentProfile.dailyInsight = {
            text: advice,
            date: new Date()
        };
        await studentProfile.save();
        console.log(`[AICoach] Generated and saved new insight for student ${studentId}`);

        res.json({ advice });

    } catch (error) {
        console.error("AI Coach Generation Failed:", error);
        res.status(500).json({ message: 'Failed to generate coach feedback' });
    }
};

// @desc    Generate Daily Adaptive Quiz
// @route   Internal (called by studentController)
const generateDailyQuiz = async (studentProfile, roadmap) => {
    try {
        // 1. Identify Weak Topics
        const weakTopics = studentProfile.weakTopics || [];
        const topWeaknesses = weakTopics
            .sort((a, b) => b.missedQuestionsCount - a.missedQuestionsCount)
            .slice(0, 3)
            .map(t => t.topic);

        // 2. Identify Current Learning Topic
        let currentTopic = "General Tech";
        if (roadmap && roadmap.milestones && roadmap.milestones.length > 0) {
            const currentMilestone = roadmap.milestones[roadmap.currentMilestoneIndex];
            if (currentMilestone) {
                currentTopic = currentMilestone.title;
            }
        }

        console.log(`[DailyQuiz] Generating for topics: ${topWeaknesses.join(', ')} OR ${currentTopic}`);

        // 3. Construct Prompt
        const prompt = `
            Create a challenging 5-question multiple-choice quiz for a software engineering student.
            
            Focus Areas:
            1. Priority: ${topWeaknesses.join(', ')} (These are weak areas, test them thoroughly).
            2. Secondary: ${currentTopic} (Current learning goal).
            
            Format: JSON Array ONLY. No markdown, no "json" tags.
            [
                {
                    "question": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswer": 0, // Index of correct option (0-3)
                    "topic": "Topic being tested (e.g. React Hooks)"
                }
            ]
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean up response if it contains markdown formatting
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const quiz = JSON.parse(jsonString);

        return quiz;

    } catch (error) {
        console.error("Quiz Generation Failed:", error);
        // Fallback Quiz
        return [
            {
                question: "What is the primary purpose of React useEffect?",
                options: ["Data Fetching", "State Management", "Routing", "Styling"],
                correctAnswer: 0,
                topic: "React"
            }
        ];
    }
};

// @desc    Generate 7-Day Recovery Plan (Structure Only)
// @route   Internal
const generateRecoveryPlan = async (milestoneTitle, weakAreas) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Act as an expert Technical Curriculum Designer.
            A student has failed an interview on: "${milestoneTitle}".
            Their specific weak areas are: ${JSON.stringify(weakAreas)}.
            
            Create a structured 7-Day Remedial Study Plan to help them recover and master these concepts.
            Day 1 starts with the basics of the weak areas, progressing to advanced application by Day 7.
            
            Return ONLY a JSON array with this exact structure (no markdown):
            [
                {
                    "day": 1,
                    "topic": "Title of the day's focus",
                    "subtopics": ["Subtopic 1", "Subtopic 2"]
                }
            ]
            ...up to day 7.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const schedule = JSON.parse(jsonString);

        return schedule;

    } catch (error) {
        console.error("Recovery Plan Logic Failed:", error);
        // Fallback Schedule
        return Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            topic: `Review ${milestoneTitle} - Part ${i + 1}`,
            subtopics: ["General Review", "Practice Code"]
        }));
    }
};

// @desc    Generate Whiteboard Notes via Interfaze API and save
// @route   POST /api/ai/whiteboard-notes
// @access  Private
const generateWhiteboardNotes = async (req, res) => {
    try {
        const { meetingId, image } = req.body;
        const studentId = req.user._id;

        if (!meetingId || !image) {
            return res.status(400).json({ message: 'Missing meetingId or image' });
        }

        const response = await interfazeClient.chat.completions.create({
            model: 'interfaze-beta',
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Please provide a structured, detailed summary and key notes of the concepts, diagrams, and text drawn on this whiteboard. Format as clear bullet points or numbered lists." },
                        {
                            type: "image_url",
                            image_url: { url: image }
                        }
                    ]
                }
            ]
        });

        const summary = response.choices[0].message.content;

        // Automatically save to DB
        const newNote = await MeetingNote.create({
            meetingId,
            studentId,
            content: summary
        });

        res.json({ notes: newNote });

    } catch (error) {
        console.error("Whiteboard Notes Generation Failed:", error);
        res.status(500).json({ message: 'Failed to generate whiteboard notes' });
    }
};

// @desc    Get all whiteboard notes for a student
// @route   GET /api/ai/notes/:studentId
// @access  Private
const getWhiteboardNotes = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        // Verify requesting user is the student or a mentor/admin
        if (req.user._id.toString() !== studentId && req.user.role !== 'mentor') {
            return res.status(403).json({ message: 'Not authorized to view these notes' });
        }

        const notes = await MeetingNote.find({ studentId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        console.error("Fetching Whiteboard Notes Failed:", error);
        res.status(500).json({ message: 'Failed to fetch whiteboard notes' });
    }
};

module.exports = { generatePerformanceSummary, summarizeYouTubeVideo, generateCoachFeedback, generateDailyQuiz, generateRecoveryPlan, generateWhiteboardNotes, getWhiteboardNotes };
