const { generateRoadmap } = require('../utils/aiService');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const Booking = require('../models/Booking');

// @desc    Generate a new roadmap or fetch existing
// @route   POST /api/roadmap/generate
// @access  Private
const generateNewRoadmap = async (req, res) => {
  const { topic, goal } = req.body;
  const userId = req.user._id;

  try {
    // 0. Check if user already has a generated roadmap that is locked
    const existingRoadmap = await Roadmap.findOne({ student: userId });
    if (existingRoadmap && existingRoadmap.isGenerated) {
      return res.status(400).json({ message: 'Roadmap already generated. Request a specialized path from your mentor.' });
    }

    // 1. Generate AI Roadmap
    const roadmapData = await generateRoadmap(topic, goal);

    // 2. Link Mentor if exists
    const lastBooking = await Booking.findOne({ student: userId, status: 'confirmed' }).sort({ date: -1 });
    const mentorId = lastBooking ? lastBooking.mentor : null;

    // 3. Prepare Data (Unlock first Milestone and Section)
    if (roadmapData.milestones.length > 0) {
      roadmapData.milestones[0].status = 'active';
      if (roadmapData.milestones[0].sections.length > 0) {
        roadmapData.milestones[0].sections[0].status = 'active';
      }
    }

    // 4. Save/Update DB
    let newRoadmap;
    if (existingRoadmap) {
      // Overwrite existing if allowed (e.g. mentor unlocked it)
      existingRoadmap.title = roadmapData.title;
      existingRoadmap.milestones = roadmapData.milestones;
      existingRoadmap.isGenerated = true;
      existingRoadmap.mentor = mentorId || existingRoadmap.mentor;
      newRoadmap = await existingRoadmap.save();
    } else {
      newRoadmap = await Roadmap.create({
        student: userId,
        title: roadmapData.title,
        goal: goal,
        milestones: roadmapData.milestones,
        mentor: mentorId,
        isGenerated: true
      });
      // Link to User
      await User.findByIdAndUpdate(userId, { roadmapId: newRoadmap._id });
    }

    res.json(newRoadmap);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate roadmap' });
  }
};

// @desc    Submit Quiz answers
// @route   POST /api/roadmap/:id/section/:milestoneIdx/:sectionIdx/quiz
// @access  Private
const submitQuiz = async (req, res) => {
  const { answers } = req.body; // Array of indices selected by user

  // Parse numeric params
  const id = req.params.id;
  const milestoneIdx = parseInt(req.params.milestoneIdx, 10);
  const sectionIdx = parseInt(req.params.sectionIdx, 10);

  try {
    const roadmap = await Roadmap.findById(id);
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    // Validate structure
    if (!roadmap.milestones || !roadmap.milestones[milestoneIdx]) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    const section = roadmap.milestones[milestoneIdx].sections[sectionIdx];
    if (!section) return res.status(404).json({ message: 'Section not found' });

    if (!section.quiz || !section.quiz.questions) {
      return res.status(400).json({ message: 'Quiz data missing for this section' });
    }

    const questions = section.quiz.questions;
    console.log(`[submitQuiz] Section has ${questions.length} questions`);
    console.log(`[submitQuiz] User answers:`, answers);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userAns = (answers && answers.length > idx) ? answers[idx] : null;
      if (userAns === q.correctAnswer) correctCount++;
    });

    const score = (correctCount / questions.length) * 100;
    const passed = score >= section.quiz.passingScore;

    // Update Section Quiz Status
    section.quiz.userScore = score;
    section.quiz.passed = passed;

    if (passed) {
      section.status = 'completed';

      // Unlock Next Section
      const currentMilestone = roadmap.milestones[milestoneIdx];
      // Use parsed Integers for arithmetic!
      if (sectionIdx + 1 < currentMilestone.sections.length) {
        console.log(`[submitQuiz] Unlocking next section: ${sectionIdx + 1}`);
        currentMilestone.sections[sectionIdx + 1].status = 'active';
      } else {
        // All sections complete.
        // DO NOT unlock next milestone here. 
        // Milestone unlock is strictly controlled by Interview Passing (bookingController.js)
        console.log(`[submitQuiz] All sections in milestone ${milestoneIdx} completed. Waiting for interview.`);
      }
    }

    await roadmap.save();

    res.json({ score, passed, section });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Submission failed' });
  }
};

// @desc    Unlock Generator (Mentor)
// @route   PUT /api/roadmap/:id/unlock
// @access  Private (Mentor)
const unlockGenerator = async (req, res) => {
  try {
    const roadmap = await Roadmap.findByIdAndUpdate(req.params.id, { isGenerated: false }, { new: true });
    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ message: 'Error unlocking roadmap' });
  }
};

// @desc    Get current user's roadmap
// @route   GET /api/roadmap
// @access  Private
const getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ student: req.user._id })
      .populate('mentor', 'name email')
      .populate('milestones.bookingId'); // Populate booking details for meeting links

    if (!roadmap) {
      return res.status(404).json({ message: 'No roadmap found' });
    }

    let roadmapData = roadmap.toObject();

    if (roadmap.mentor) {
      // Fetch specific mentor profile details (jobTitle, etc)
      const mentorProfile = await require('../models/Mentor').findOne({ user: roadmap.mentor._id });
      if (mentorProfile) {
        roadmapData.mentor = {
          ...roadmapData.mentor,
          jobTitle: mentorProfile.jobTitle,
          hourlyRate: mentorProfile.hourlyRate,
          img: mentorProfile.img // if we had it
        };
      }
    }

    res.json(roadmapData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a specific student's roadmap (Mentor only)
// @route   GET /api/roadmap/student/:studentId
// @access  Private (Mentor)
const getRoadmapByStudentId = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ student: req.params.studentId }).populate('milestones.bookingId');
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' });
    }
    res.json(roadmap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a roadmap (Mentor only)
// @route   PUT /api/roadmap/:id
// @access  Private (Mentor)
const updateRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    // Sync Student Progress
    if (roadmap) {
      const Student = require('../models/Student');
      const total = roadmap.milestones.length;
      const completed = roadmap.milestones.filter(m => m.status === 'completed').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      await Student.findOneAndUpdate(
        { user: roadmap.student },
        { roadmapProgress: progress }
      );
    }

    res.json(roadmap);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { generateNewRoadmap, getRoadmap, getRoadmapByStudentId, updateRoadmap, submitQuiz, unlockGenerator };
