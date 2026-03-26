const Mentor = require('../models/Mentor');
const User = require('../models/User');
const Student = require('../models/Student');
const Roadmap = require('../models/Roadmap');
const Booking = require('../models/Booking');

// @desc    Get current mentor profile
// @route   GET /api/mentors/me
// @access  Private (Mentor only)
const getMe = async (req, res) => {
    try {
        // req.user is set by auth middleware
        let mentor = await Mentor.findOne({ user: req.user.id }).populate('user', 'name email');

        if (!mentor) {
            // Self-healing: Create a profile if it doesn't exist (e.g., legacy user)
            mentor = await Mentor.create({ user: req.user.id });
            // Populate user details for the response
            mentor = await mentor.populate('user', 'name email');
        }

        res.json(mentor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update mentor profile
// @route   PUT /api/mentors/profile
// @access  Private (Mentor only)
const updateProfile = async (req, res) => {
    const { bio, skills, jobTitle, company, availability, hourlyRate } = req.body;

    console.log("Updating Mentor Profile:", req.user.id, req.body); // DEBUG

    try {
        let mentor = await Mentor.findOne({ user: req.user.id });

        if (!mentor) {
            console.log("Mentor profile not found, creating new one..."); // DEBUG
            // Self-healing: Create a profile if it doesn't exist
            mentor = await Mentor.create({ user: req.user.id });
        }

        // Update fields
        if (bio !== undefined) mentor.bio = bio;
        if (skills !== undefined) mentor.skills = skills;
        if (jobTitle !== undefined) mentor.jobTitle = jobTitle;
        if (company !== undefined) mentor.company = company;
        if (availability !== undefined) {
            console.log("Setting availability:", availability); // DEBUG
            mentor.availability = availability;
        }
        if (hourlyRate !== undefined) mentor.hourlyRate = hourlyRate; // Add hourlyRate support

        // Save
        const updatedMentor = await mentor.save();
        console.log("Mentor Profile Updated Successfully:", updatedMentor); // DEBUG
        res.json(updatedMentor);

    } catch (error) {
        console.error("Error updating mentor profile:", error); // DEBUG
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get mentor dashboard stats
// @route   GET /api/mentors/stats
// @access  Private (Mentor only)
const getDashboardStats = async (req, res) => {
    try {
        const mentorUserId = req.user.id;

        // 1. Total Students (Unique students booking this mentor)
        const uniqueStudents = await Booking.distinct('student', { mentor: mentorUserId });
        const totalStudents = uniqueStudents.length;

        // 2. Today's Sessions
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todaysBookings = await Booking.find({
            mentor: mentorUserId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'cancelled' }
        }).populate('student', 'name email img');

        // Filter out bookings where student is null (e.g. deleted user)
        const validBookings = todaysBookings.filter(b => b.student);

        const todaysSessionsCount = validBookings.length;

        // 3. Hours Mentored (Assumes 1hr per completed session for now)
        const completedBookingsCount = await Booking.countDocuments({
            mentor: mentorUserId,
            status: 'completed'
        });
        const hoursMentored = completedBookingsCount * 1; // 1 hour per session

        // 4. Recent Activity (Mocked for now)
        const recentActivity = [
            { id: 1, text: "New booking from Arjun", time: "2 hours ago" },
            { id: 2, text: "Sarah completed 'React Basics'", time: "5 hours ago" }
        ];

        res.json({
            stats: {
                totalStudents,
                todaysSessions: todaysSessionsCount,
                hoursMentored
            },
            liveQueue: validBookings,
            recentActivity
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get my students (with progress)
// @route   GET /api/mentors/my-students
// @access  Private (Mentor only)
const getMyStudents = async (req, res) => {
    try {
        const mentorUserId = req.user.id;
        console.log(`[getMyStudents] Requesting for Mentor ID: ${mentorUserId}`);

        // 1. Find all students who have booked this mentor
        const bookings = await Booking.find({ mentor: mentorUserId }).select('student');
        console.log(`[getMyStudents] Found ${bookings.length} bookings.`);

        // Extract unique student IDs
        const uniqueStudentIds = [...new Set(bookings
            .filter(b => b.student)
            .map(b => b.student.toString()))];

        console.log(`[getMyStudents] Unique Student IDs (raw):`, uniqueStudentIds);

        const studentIds = uniqueStudentIds.filter(id => id !== mentorUserId);
        console.log(`[getMyStudents] Filtered Student IDs (excluding self):`, studentIds);

        // 2. Fetch details for each student
        const studentsData = await Promise.all(studentIds.map(async (studentId) => {
            const user = await User.findById(studentId).select('name email');
            if (!user) {
                console.log(`[getMyStudents] User not found for ID: ${studentId}`);
                return null;
            }

            const studentProfile = await Student.findOne({ user: studentId });
            const roadmap = await Roadmap.findOne({ student: studentId });

            console.log(`[getMyStudents] Processing student: ${user.name}`);

            // Calculate Progress
            let progress = studentProfile?.roadmapProgress || 0;

            if (progress === 0 && roadmap) {
                // Fallback: Calculate from Milestones if stored progress is 0 (migration/legacy case)
                if (roadmap.milestones && roadmap.milestones.length > 0) {
                    const total = roadmap.milestones.length;
                    const completed = roadmap.milestones.filter(m => m.status === 'completed').length;
                    progress = Math.round((completed / total) * 100);
                } else if (roadmap.weeks) {
                    // Legacy Weeks logic
                    let totalTasks = 0;
                    let completedTasks = 0;
                    roadmap.weeks.forEach(week => {
                        if (week.tasks) {
                            week.tasks.forEach(task => {
                                totalTasks++;
                                if (task.completed) completedTasks++;
                            });
                        }
                    });
                    if (totalTasks > 0) {
                        progress = Math.round((completedTasks / totalTasks) * 100);
                    }
                }
            }

            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                goal: studentProfile?.learningGoals || roadmap?.goal || 'No goal set',
                progress: progress,
                roadmapId: roadmap?._id
            };
        }));

        // Filter out any nulls
        const validStudents = studentsData.filter(s => s !== null);
        console.log(`[getMyStudents] Returning ${validStudents.length} valid students.`);

        res.json(validStudents);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Grade a student interview
// @route   POST /api/mentors/grade-interview
// @access  Private (Mentor only)
const gradeInterview = async (req, res) => {
    console.log("Receiving Grade Request:", req.body);
    const { studentId, roadmapId, milestoneIdx, score, feedback, weakTopics } = req.body;

    try {
        const roadmap = await Roadmap.findOne({ _id: roadmapId, mentor: req.user.id });
        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found or unauthorized' });
        }

        const milestone = roadmap.milestones[milestoneIdx];
        if (!milestone) {
            return res.status(404).json({ message: 'Milestone not found' });
        }

        // 1. Update Milestone Stats
        milestone.interviewScore = score;
        milestone.interviewFeedback = feedback;
        milestone.interviewStatus = score >= 75 ? 'passed' : 'retake';
        milestone.weakConcepts = weakTopics || [];

        // 2. Handle Milestone Unlocking
        let unlockedNext = false;
        if (score >= 75) {
            milestone.status = 'completed';

            // Unlock next milestone if exists
            if (milestoneIdx + 1 < roadmap.milestones.length) {
                roadmap.milestones[milestoneIdx + 1].status = 'active';
                unlockedNext = true;
            }
        }

        await roadmap.save();

        // 3. Update Student Weak Topics
        if (weakTopics && weakTopics.length > 0) {
            const student = await Student.findOne({ user: studentId });
            if (student) {
                // Ensure weakTopics is initialized
                if (!student.weakTopics) {
                    student.weakTopics = [];
                }

                weakTopics.forEach(topic => {
                    // Check if topic already exists in weakTopics
                    const existingTopic = student.weakTopics.find(t => t.topic.toLowerCase() === topic.toLowerCase());
                    if (existingTopic) {
                        existingTopic.missedQuestionsCount += 1; // Increment weight
                        existingTopic.lastMissed = new Date();
                        existingTopic.source = 'mentor';
                    } else {
                        student.weakTopics.push({
                            topic: topic,
                            missedQuestionsCount: 1,
                            lastMissed: new Date(),
                            source: 'mentor'
                        });
                    }
                });
                await student.save();
            }
        }

        res.json({
            message: 'Interview graded successfully',
            status: milestone.interviewStatus,
            unlockedNext
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getMe, updateProfile, getDashboardStats, getMyStudents, gradeInterview };