const mongoose = require('mongoose');

const MeetingNoteSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MeetingNote', MeetingNoteSchema);
