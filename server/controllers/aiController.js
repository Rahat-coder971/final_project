const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
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

// @desc    Chat with the Platform AI Assistant
// @route   POST /api/ai/chat
// @access  Private
const chatWithBot = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build the prompt with context
        const context = `
            You are the Elevate Hub AI Assistant. Your job is to help users navigate and understand this platform.
            
            Platform Features to remember:
            1. AI-Powered Dynamic Roadmaps: Automatically generated paths tailored to student goals.
            2. Lock & Key Progression: Content is locked by default. Students must pass a review (75% or higher score) with a mentor to unlock the next milestone. This ensures mastery.
            3. Performance Tracker: A dashboard with Focus Areas, Skills Radar, and Mentor Guidance.
            4. Interactive Learning: Quizzes and Projects to prepare for interviews.
            5. Mentorship: Real-time 'Grade Now' tools, custom roadmaps editing, and actionable feedback.

            Guidelines:
            - Keep answers concise, friendly, and practical.
            - Relate answers to the specific features of Elevate Hub when possible.
            - If you don't know the answer, politely say so. Do NOT invent new features that Elevate Hub does not have.
        `;

        // Format history for Gemini if passed, otherwise just use prompt
        const chatSession = model.startChat({
            history: history || [], // history format: [{role: 'user'/'model', parts: [{text: '...'}]}]
            systemInstruction: context
        });

        const result = await chatSession.sendMessage(message);
        const reply = result.response.text();

        res.json({ reply });

    } catch (error) {
        console.error("AI Chatbot Failed:", error);
        res.status(500).json({ message: 'Failed to process chat request' });
    }
};

// @desc    Extract text from PDF
// @route   POST /api/ai/extract-pdf
// @access  Private
const extractPdfText = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const data = await pdfParse(req.file.buffer);
        res.json({ text: data.text });
    } catch (error) {
        console.error("PDF Extraction Failed:", error);
        res.status(500).json({ message: 'Failed to extract PDF text' });
    }
};

// @desc    Chat with a specific PDF context
// @route   POST /api/ai/pdf-chat
// @access  Private
const chatWithPdf = async (req, res) => {
    try {
        const { message, context, history } = req.body;

        if (!message || !context) {
            return res.status(400).json({ message: 'Message and PDF context are required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemInstruction = `
            You are a helpful AI assistant. Answer the user's question based strictly on the following document content.
            If the answer is not in the document, politely state that you cannot answer based on the provided context.
            
            Document Content:
            ${context}
        `;

        const chatSession = model.startChat({
            history: history || [],
            systemInstruction
        });

        const result = await chatSession.sendMessage(message);
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("PDF Chat Failed:", error);
        res.status(500).json({ message: 'Failed to chat with PDF' });
    }
};

// @desc    Score a Resume PDF
// @route   POST /api/ai/resume-score
// @access  Private
const scoreResume = async (req, res) => {
    try {
        // if they passed text directly
        let text = req.body.text; 
        
        // if they passed a file
        if (!text && req.file) {
            const data = await pdfParse(req.file.buffer);
            text = data.text;
        }

        if (!text) {
            return res.status(400).json({ message: 'No resume content provided' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Act as an expert ATS (Applicant Tracking System) and Technical Recruiter.
            Review the following resume and evaluate it.
            
            You must return ONLY a raw JSON object (no markdown, no backticks, no \`\`\`json) with the following exact structure:
            {
                "score": 85,
                "strengths": ["Strength 1", "Strength 2", "Strength 3"],
                "weaknesses": ["Area for improvement 1", "Area for improvement 2"],
                "verdict": "A short 2-3 sentence summary of the resume's quality."
            }
            
            Resume Content:
            ${text}
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        // Clean up markdown just in case
        responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const scoreData = JSON.parse(responseText);

        res.json(scoreData);

    } catch (error) {
        console.error("Resume Scoring Failed:", error);
        res.status(500).json({ message: 'Failed to score resume' });
    }
};

module.exports = { generatePerformanceSummary, generateCoachFeedback, generateDailyQuiz, generateRecoveryPlan, generateWhiteboardNotes, getWhiteboardNotes, chatWithBot, extractPdfText, chatWithPdf, scoreResume };
