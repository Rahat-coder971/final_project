const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
    interests: [{ type: String }],
    learningGoals: { type: String, default: '' },

    // Performance Tracker Metrics
    skillLevels: { type: Map, of: Number, default: {} }, // e.g., { "React": 80, "Logic": 60 }
    completedInterviews: { type: Number, default: 0 },
    roadmapProgress: { type: Number, default: 0 }, // 0-100%
    mentorPrepAdvice: { type: String, default: '' }, // Forward-looking advice from mentor

    // Study Goals (User Defined)
    goals: [{
        title: String,
        targetDate: Date,
        completed: { type: Boolean, default: false },
        linkedTopic: String
    }],

    // Weakness Tracking (Aggregated from Daily Tests & Interviews)
    weakTopics: [{
        topic: String,
        missedQuestionsCount: { type: Number, default: 0 },
        lastMissed: Date,
        source: { type: String, enum: ['ai', 'mentor'], default: 'ai' }
    }],

    // Performance History
    snapshots: [{
        date: { type: Date, default: Date.now },
        progress: { type: Number }, // Roadmap Progress %
        skillLevels: { type: Map, of: Number } // Snapshot of skills at that time
    }],

    // Streak Tracking
    streak: {
        current: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        lastActiveDate: { type: Date, default: null },
        history: [{ type: Date }] // Dates where streak was active
    },

    // Coach's Daily Insight
    dailyInsight: {
        text: { type: String, default: '' },
        date: { type: Date, default: null }
    },

    // Daily Generated Quiz (Cached)
    dailyQuiz: {
        date: { type: Date, default: null }, // To check if we already generated one today
        questions: [{
            question: String,
            options: [String],
            correctAnswer: Number, // Index
            topic: String
        }],
        completed: { type: Boolean, default: false }
    },

    // Weekly Recovery Challenge (Intervention System)
    recoveryPlan: {
        active: { type: Boolean, default: false },
        sourceMilestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
        title: { type: String, default: '' }, // e.g., "Recovery: Node.js Basics"
        weakAreas: [{ type: String }], // e.g. ["Event Loop", "Streams"]

        // 7-Day Schedule
        schedule: [{
            day: { type: Number }, // 1-7
            topic: { type: String }, // Granular topic for the day
            status: { type: String, enum: ['locked', 'unlocked', 'completed'], default: 'locked' },
            score: { type: Number, default: 0 },
            completedAt: Date
        }],

        startDate: Date,
        lastActiveDate: Date
    },

    // AI Analytics (Next Best Action & Weekly Impact)
    analyticsInsight: {
        nextBestAction: {
            title: { type: String },
            reason: { type: String }
        },
        weeklyImpact: [{
            skill: { type: String },
            change: { type: String }, // e.g., "+12%"
            direction: { type: String } // "up", "down"
        }],
        date: { type: Date, default: null }
    },

    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
