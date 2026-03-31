const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generatePerformanceSummary, generateCoachFeedback, generateWhiteboardNotes, getWhiteboardNotes, chatWithBot, extractPdfText, chatWithPdf, scoreResume } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/performance-summary', protect, generatePerformanceSummary);
router.post('/coach', protect, generateCoachFeedback);
router.post('/whiteboard-notes', protect, generateWhiteboardNotes);
router.get('/notes/:studentId', protect, getWhiteboardNotes);
router.post('/chat', protect, chatWithBot);

// PDF and Resume Features
router.post('/extract-pdf', protect, upload.single('file'), extractPdfText);
router.post('/pdf-chat', protect, chatWithPdf);
router.post('/resume-score', protect, upload.single('file'), scoreResume);

module.exports = router;
