const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    jobTitle: { type: String, default: '' },
    company: { type: String, default: '' }, // Added company
    hourlyRate: { type: Number, default: 0 }, // Added hourlyRate
    rating: { type: Number, default: 0 },
    availability: [{ type: String }], // e.g., ["Monday 10am"]
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mentor', mentorSchema);
