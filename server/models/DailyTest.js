const mongoose = require('mongoose');

const dailyTestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now // Should be normalized to start of day in controller
    },
    score: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    correctAnswers: {
        type: Number,
        required: true
    },
    // Granular Question Tracking
    questions: [{
        questionText: String,
        topic: String, // e.g., "React Hooks"
        isCorrect: Boolean,
        selectedOption: String
    }],
    topics: [{
        type: String // e.g., "React", "Node.js", "System Design"
    }],
    timeSpent: {
        type: Number, // In seconds
        default: 0
    },
    streakActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('DailyTest', dailyTestSchema);
