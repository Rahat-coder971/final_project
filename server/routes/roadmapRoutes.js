const express = require('express');
const router = express.Router();
const { generateNewRoadmap, getRoadmap, getRoadmapByStudentId, updateRoadmap, submitQuiz, unlockGenerator } = require('../controllers/roadmapController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateNewRoadmap);
router.get('/', protect, getRoadmap);
router.get('/student/:studentId', protect, getRoadmapByStudentId);
router.put('/:id', protect, updateRoadmap);
router.post('/:id/section/:milestoneIdx/:sectionIdx/quiz', protect, submitQuiz);
router.put('/:id/unlock', protect, unlockGenerator);

module.exports = router;
