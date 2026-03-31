const User = require('../models/User');
const Mentor = require('../models/Mentor');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'student',
        });

        if (user) {
            // Create Profile based on role
            if (user.role === 'mentor') {
                await Mentor.create({ user: user._id });
            } else {
                await Student.create({ user: user._id });
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            let profileId = null;
            if (user.role === 'mentor') {
                const mentorDoc = await Mentor.findOne({ user: user._id });
                profileId = mentorDoc ? mentorDoc._id : null;
            } else {
                const studentDoc = await Student.findOne({ user: user._id });
                profileId = studentDoc ? studentDoc._id : null;
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileId: profileId,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Helper for OAuth Login/Register
const handleOAuthLogin = async (email, name, role = 'student') => {
    let user = await User.findOne({ email });

    if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), salt);
        user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
        });

        if (user.role === 'mentor') {
            await Mentor.create({ user: user._id });
        } else {
            await Student.create({ user: user._id });
        }
    }

    let profileId = null;
    if (user.role === 'mentor') {
        const mentorDoc = await Mentor.findOne({ user: user._id });
        profileId = mentorDoc ? mentorDoc._id : null;
    } else {
        const studentDoc = await Student.findOne({ user: user._id });
        profileId = studentDoc ? studentDoc._id : null;
    }

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId: profileId,
        token: generateToken(user._id),
    };
};

// @desc    Google Sign In
// @route   POST /api/auth/google
// @access  Public
const googleSignIn = async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) return res.status(400).json({ message: 'No access token provided' });

        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { email, name } = response.data;
        if (!email) return res.status(400).json({ message: 'Failed to get email from Google' });

        const userData = await handleOAuthLogin(email, name);
        res.json(userData);
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
};

// @desc    GitHub Sign In
// @route   POST /api/auth/github
// @access  Public
const githubSignIn = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'No code provided' });

        // Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID || 'dummy_client_id',
            client_secret: process.env.GITHUB_CLIENT_SECRET || 'dummy_client_secret',
            code
        }, {
            headers: { Accept: 'application/json' }
        });

        const access_token = tokenResponse.data.access_token;
        if (!access_token) return res.status(400).json({ message: 'Failed to get access token from GitHub' });

        // Get user profile
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const name = userResponse.data.name || userResponse.data.login;

        // Get user emails (primary one)
        const emailResponse = await axios.get('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const primaryEmailObj = emailResponse.data.find(e => e.primary) || emailResponse.data[0];
        const email = primaryEmailObj?.email;

        if (!email) return res.status(400).json({ message: 'Failed to get email from GitHub' });

        const userData = await handleOAuthLogin(email, name);
        res.json(userData);
    } catch (error) {
        console.error('GitHub Auth Error:', error);
        res.status(500).json({ message: 'GitHub authentication failed' });
    }
};

// @desc    Firebase Social Sign In
// @route   POST /api/auth/firebase-signin
// @access  Public
const firebaseSignIn = async (req, res) => {
    try {
        const { email, name, role } = req.body;
        if (!email) return res.status(400).json({ message: 'No email provided' });

        const userData = await handleOAuthLogin(email, name, role);
        res.json(userData);
    } catch (error) {
        console.error('Firebase Auth Error:', error);
        res.status(500).json({ message: 'Authentication failed' });
    }
};

module.exports = { registerUser, loginUser, googleSignIn, githubSignIn, firebaseSignIn, handleOAuthLogin };
