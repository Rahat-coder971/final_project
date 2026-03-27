const express = require('express');
const router = express.Router();
const { generatePerformanceSummary, generateCoachFeedback, generateWhiteboardNotes, getWhiteboardNotes } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/performance-summary', protect, generatePerformanceSummary);
router.post('/coach', protect, generateCoachFeedback);
router.post('/whiteboard-notes', protect, generateWhiteboardNotes);
router.get('/notes/:studentId', protect, getWhiteboardNotes);

module.exports = router;
