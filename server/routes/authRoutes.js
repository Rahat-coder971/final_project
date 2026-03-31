const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleSignIn, githubSignIn, firebaseSignIn } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleSignIn);
router.post('/github', githubSignIn);
router.post('/firebase-signin', firebaseSignIn);

module.exports = router;
