const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Roadmap = require('../models/Roadmap');
const { getAnalyticsDashboard } = require('../controllers/analyticsController');

// Mock Request/Response objects
const mockReq = (params = {}) => ({
    params
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
        const studentUser = await User.create({ name: 'Alert Tester', email: `alert${Date.now()}@test.com`, password: '123', role: 'student' });

        // Create Roadmap with specific weak concepts in latest milestone
        const roadmap = await Roadmap.create({
            student: studentUser._id,
            title: 'Test Roadmap',
            goal: 'Test Goal', // Required field
            milestones: [
                {
                    title: 'Milestone 1',
                    status: 'completed',
                    weakConcepts: ['Recursion', 'Graph Theory'], // Mentor flagged these
                    updatedAt: new Date()
                }
            ]
        });

        const studentProfile = await Student.create({
            user: studentUser._id,
            roadmap: roadmap._id,
            weakTopics: [
                { topic: 'Recursion', missedQuestionsCount: 2, source: 'ai' } // Check merge logic
            ]
        });

        console.log("Setup Complete. Student User ID:", studentUser._id);

        // 2. Execute getAnalyticsDashboard
        const req = mockReq({ studentId: studentUser._id });
        const res = mockRes();

        console.log("Fetching Analytics Dashboard...");
        await getAnalyticsDashboard(req, res);

        // 3. Verify Results
        if (res.statusCode && res.statusCode !== 200) {
            console.error("FAILED: Controller returned status", res.statusCode, res.data);
            process.exit(1);
        }

        const analytics = res.data;
        console.log("Analytics Data Recieved");

        // Check needsAttention
        const needsAttention = analytics.needsAttention;
        console.log("Needs Attention Array:", JSON.stringify(needsAttention, null, 2));

        // Verify Recursion (Should be merged 'Mentor & AI')
        const recursion = needsAttention.find(n => n.topic === 'Recursion');
        if (recursion && recursion.source.includes('Mentor')) {
            console.log("PASSED: Recursion correctly identified as Mentor source.");
        } else {
            console.error("FAILED: Recursion source incorrect or missing.");
            process.exit(1);
        }

        // Verify Graph Theory (Should be 'Mentor Flagged')
        const graph = needsAttention.find(n => n.topic === 'Graph Theory');
        if (graph && graph.source.includes('Mentor')) {
            console.log("PASSED: Graph Theory correctly identified as Mentor source.");
        } else {
            console.error("FAILED: Graph Theory source incorrect or missing.");
            process.exit(1);
        }

        // Cleanup
        await Roadmap.deleteMany({ _id: roadmap._id });
        await Student.deleteMany({ _id: studentProfile._id });
        await User.deleteMany({ _id: studentUser._id });

        console.log("Test Cleanup Complete.");
        process.exit(0);

    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
}

runTest();
