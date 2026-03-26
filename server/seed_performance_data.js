const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const DailyTest = require('./models/DailyTest'); // Ensure path is correct
const User = require('./models/User');

const path = require('path');
const fs = require('fs');

// Manual .env parsing
try {
    const envPath = path.join(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn("Could not read .env file manually", e);
}

// Fallback to dotenv if needed
// const dotenv = require('dotenv'); // Already required at top
// dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
console.log('Connecting to MongoDB...', mongoUri ? 'URI Found' : 'URI Missing');

const seedData = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected');

        // Find the specific user "Rahat Husain Khan" OR just the first user
        let user = await User.findOne({ name: { $regex: 'Rahat Husain', $options: 'i' } });
        if (!user) {
            console.log("User 'Rahat' not found. Falling back to first available user.");
            user = await User.findOne();
        }

        if (!user) {
            console.error("No users found in database. Please create a user first.");
            process.exit(1);
        }

        let student = await Student.findOne({ user: user._id });
        if (!student) {
            console.log("Student profile not found. Creating one...");
            student = new Student({
                user: user._id,
                roadmap: null, // Can't easily guess this, leave null or find a roadmap
                interests: ['React', 'Full Stack'],
                learningGoals: 'Become a Senior Developer',
                skillLevels: { React: 50, NodeJS: 40 },
                completedInterviews: 0,
                roadmapProgress: 10,
                streak: { current: 0, max: 0, lastActiveDate: null }
            });
            await student.save();
            console.log("New Student profile created.");
        }

        console.log(`Seeding data for student: ${user.name}`);

        // 1. Update Student Skills (for Topic Strength & Radar)
        student.skills = [
            { subject: 'React', A: 85, fullMark: 100 },
            { subject: 'NodeJS', A: 65, fullMark: 100 },
            { subject: 'MongoDB', A: 75, fullMark: 100 },
            { subject: 'JavaScript', A: 90, fullMark: 100 },
            { subject: 'System Design', A: 40, fullMark: 100 },
            { subject: 'CSS/UI', A: 95, fullMark: 100 }
        ];
        student.readiness = 72; // Update readiness score
        student.streak = { current: 12, max: 15, lastActiveDate: new Date() };

        // Add a daily insight
        student.dailyInsight = {
            text: "You are showing great consistency in React. Focus on System Design today to boost your interviewing readiness.",
            date: new Date()
        };

        await student.save();
        console.log('Student skills and profile updated.');

        // 2. Generate 90 Days of Daily Tests (for Heatmap & Daily Trend)
        // Clear old tests for this student to avoid clutter? Maybe keep them.
        // Let's just add new ones or overwrite strictly for the last 90 days.

        // Delete tests from last 90 days to re-seed nicely
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        await DailyTest.deleteMany({ student: student._id, date: { $gte: ninetyDaysAgo } });

        const testDocs = [];
        for (let i = 89; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0); // Normalize time

            // Random score with upward trend logic (over 90 days)
            // Base score 40, trend adds 0-40 based on recency

            // Simulate: Started low (40), stayed there, then improved to 80
            let score = 40;
            if (i < 60) score += 10;
            if (i < 30) score += 20;
            if (i < 10) score += 10;

            score += (Math.random() * 20 - 10); // Noise

            if (score > 100) score = 100;
            if (score < 0) score = 0;

            testDocs.push({
                student: student._id,
                date: date,
                score: Math.round(score),
                totalQuestions: 5,
                correctAnswers: Math.round((score / 100) * 5),
                topics: ['React', 'Node.js'],
                questions: [], // Dummy
                streakActive: true
            });
        }

        await DailyTest.insertMany(testDocs);
        console.log('DailyTest history (30 days) seeded.');

        console.log('Seeding Complete. Refresh Frontend.');
        process.exit();

    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedData();
