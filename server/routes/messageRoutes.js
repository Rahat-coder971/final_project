const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, getConversations } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations); // Must be before /:otherUserId
router.get('/:otherUserId', protect, getMessages);

module.exports = router;
