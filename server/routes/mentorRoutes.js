const express = require('express');
const router = express.Router();
const { getMe, updateProfile, getDashboardStats, getMyStudents, gradeInterview } = require('../controllers/mentorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.get('/stats', protect, getDashboardStats);
router.get('/my-students', protect, getMyStudents);
router.put('/profile', protect, updateProfile);
router.post('/grade-interview', protect, gradeInterview); // Added Grading Route

module.exports = router;
