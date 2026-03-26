const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // The selected slot
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'confirmed' },
    meetingLink: { type: String }, // Zoom Join URL
    meetingPassword: { type: String },

    // Interview & Mastery Gate Fields
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },
    milestoneIndex: { type: Number }, // Index of the milestone this booking is for
    outcome: {
        score: { type: Number }, // 0-100
        feedback: { type: String },
        mentorNotes: { type: String },
        passed: { type: Boolean },
        sentiment: { type: String }, // e.g., 'Positive', 'Neutral', 'Negative'
        focusArea: { type: String }, // e.g., 'Code Quality', 'System Design'
        weakConcepts: [String] // Store the raw list here too for record keeping
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
