const express = require('express');
const router = express.Router();
const { getMentors } = require('../controllers/userController');

router.get('/mentors', getMentors);

module.exports = router;
