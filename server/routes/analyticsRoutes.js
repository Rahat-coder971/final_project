const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Generate Daily Test (Gemini Powered)
router.get('/daily-test/generate/:studentId', analyticsController.generateDailyTest);

// Submit Daily Test (Update Streak & Save Result)
router.post('/daily-test/submit', analyticsController.submitDailyTest);

// Get Analytics Dashboard Data (Velocity, Weekly Comparison)
router.get('/dashboard/:studentId', analyticsController.getAnalyticsDashboard);

// Get Activity Grid (365 days of activity for streak visualization)
router.get('/activity-grid/:studentId', analyticsController.getActivityGrid);

// New Analytics Routes for Performance 2.0
router.get('/activity-grid/:studentId', analyticsController.getActivityGrid);
router.get('/mistakes/:studentId', analyticsController.getMistakeBank);

module.exports = router;
