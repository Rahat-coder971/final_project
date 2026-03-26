const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'mentor'], default: 'student' },

    // Specific to Mentor
    bio: { type: String },
    skills: [{ type: String }],
    rating: { type: Number, default: 0 },
    jobTitle: { type: String },
    availability: [{ type: String }], // e.g., ["Monday 10am", "Friday 2pm"]

    // Specific to Student
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap' },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
