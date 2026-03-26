const express = require('express');
const router = express.Router();
const { createBooking, getBookings, completeInterview } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBooking);
router.get('/', protect, getBookings);

// @desc    Complete an interview (Mentor)
router.put('/:id/complete', protect, completeInterview);

module.exports = router;
