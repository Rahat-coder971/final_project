const express = require('express');
const router = express.Router();
const { getStudentProfile, getStudentById, updateStudentSkills, getDailyQuiz, submitDailyQuiz, testDebug, getRecoveryChallenge, startRecoveryDay, submitRecoveryDay } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getStudentProfile);
router.get('/test/debug', testDebug);
router.get('/daily-quiz', protect, getDailyQuiz);
router.post('/daily-quiz', protect, submitDailyQuiz);

// Weekly Recovery Challenge
router.get('/recovery-challenge', protect, getRecoveryChallenge);
router.post('/recovery-challenge/start-day', protect, startRecoveryDay);
router.post('/recovery-challenge/submit-day', protect, submitRecoveryDay);

router.get('/:id', protect, getStudentById);
router.put('/:id/skills', protect, updateStudentSkills);

module.exports = router;
