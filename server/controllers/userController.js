const Mentor = require('../models/Mentor');

// @desc    Get all mentors
// @route   GET /api/users/mentors
// @access  Public
const getMentors = async (req, res) => {
    try {
        // Fetch mentors and populate user details (name, email)
        const mentors = await Mentor.find().populate('user', 'name email');

        // Transform data to flatten structure for frontend if needed
        const formattedMentors = mentors
            .filter(m => m.user) // Filter out mentors with null user (deleted users)
            .map(m => ({
                _id: m.user._id, // Keep using User ID as the main ID for booking? Or Mentor ID?
                // Actually, for booking we used Mentor ID (which was User ID before). 
                // Now we have a Mentor Document ID. 
                // But the Booking model references 'User'. 
                // So we should return the USER ID as the main identifier for compatibility.
                mentorProfileId: m._id,
                name: m.user.name,
                email: m.user.email,
                role: 'mentor',
                bio: m.bio,
                skills: m.skills,
                jobTitle: m.jobTitle,
                company: m.company,
                rating: m.rating,
                availability: m.availability
            }));

        res.json(formattedMentors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getMentors };
