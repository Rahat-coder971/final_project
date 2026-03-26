const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    goal: { type: String, required: true },
    currentMilestoneIndex: { type: Number, default: 0 },
    isGenerated: { type: Boolean, default: false }, // Locks generation after first use

    milestones: [{
        title: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: ['locked', 'active', 'completed'], default: 'locked' },
        resources: [{ title: String, url: String }],
        mentorNotes: { type: String },
        sections: [{
            title: { type: String, required: true },
            status: { type: String, enum: ['locked', 'active', 'completed'], default: 'locked' },
            description: { type: String }, // specific description for section
            mentorNotes: { type: String }, // private or public notes from mentor
            resources: [{ title: String, url: String, type: { type: String, default: 'link' } }], // e.g., video, article
            chapters: [{
                title: { type: String, required: true },
                completed: { type: Boolean, default: false },
                resources: [{ title: String, url: String }]
            }],
            quiz: {
                questions: [{
                    question: String,
                    options: [String],
                    correctAnswer: Number // Index of correct option
                }],
                passingScore: { type: Number, default: 75 },
                userScore: { type: Number, default: 0 },
                passed: { type: Boolean, default: false }
            }
        }],
        // Interview Data
        interviewFeedback: { type: String, default: '' },
        interviewScore: { type: Number, default: 0 }, // 0-100
        interviewStatus: { type: String, enum: ['pending', 'scheduled', 'passed', 'retake'], default: 'pending' },
        interviewSentiment: { type: String },
        interviewFocusArea: { type: String },
        weakConcepts: [{ type: String }], // Concepts flagged by mentor as needing improvement
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }
    }],

    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
