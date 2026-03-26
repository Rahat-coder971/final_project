const Booking = require('../models/Booking');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { v4: uuidv4 } = require('uuid'); // Or just use Date.now if uuid is not installed, let's use a simple distinct string
const { sendBookingConfirmation, sendNewBookingNotification, sendMentorScheduledNotification } = require('../utils/emailService');

// @desc    Create a new booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
    let studentId, mentorId;

    if (req.user.role === 'mentor') {
        mentorId = req.user.id;
        studentId = req.body.studentId;
    } else {
        studentId = req.user.id;
        mentorId = req.body.mentorId;
    }

    const { date } = req.body;

    try {
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ message: 'Mentor not found' });
        }

        const student = await User.findById(studentId);

        // 1. Generate Jitsi Meeting Details
        // Room Name: Elevate-[MentorInitials]-[StudentInitials]-[Timestamp]
        const roomName = `Elevate-${mentor.name.replace(/\s/g, '')}-${student.name.replace(/\s/g, '')}-${Date.now()}`;
        const joinUrl = `https://meet.jit.si/${roomName}`;

        // 2. Save Booking to DB
        const booking = await Booking.create({
            student: studentId,
            mentor: mentorId,
            date: date,
            meetingLink: joinUrl,
            meetingPassword: '', // Jitsi assumes open or lobby
            roadmapId: req.body.roadmapId,
            milestoneIndex: req.body.milestoneIndex
        });

        // 2b. If linked to a milestone, update Roadmap
        if (req.body.roadmapId && req.body.milestoneIndex !== undefined) {
            const roadmap = await Roadmap.findById(req.body.roadmapId);
            if (roadmap && roadmap.milestones[req.body.milestoneIndex]) {
                roadmap.milestones[req.body.milestoneIndex].bookingId = booking._id;
                roadmap.milestones[req.body.milestoneIndex].interviewStatus = 'scheduled';
                await roadmap.save();
            }
        }

        // 3. Send Email Notifications (Async - don't block response)
        // 3. Send Email Notifications (Async - don't block response)
        const formattedDate = new Date(date).toLocaleString();

        if (req.user.role === 'mentor') {
            // Mentor Scheduled it
            // 1. Notify Student
            sendMentorScheduledNotification(student.email, student.name, mentor.name, formattedDate, joinUrl).catch(console.error);
            // 2. Confirm to Mentor
            sendBookingConfirmation(mentor.email, mentor.name, student.name, formattedDate, joinUrl).catch(console.error);
        } else {
            // Student Booked it
            sendBookingConfirmation(student.email, student.name, mentor.name, formattedDate, joinUrl).catch(console.error);
            sendNewBookingNotification(mentor.email, mentor.name, student.name, formattedDate).catch(console.error);
        }

        res.status(201).json(booking);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Booking failed', error: error.message });
    }
};

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
    try {
        let bookings;
        // If student, get their bookings. If mentor, get bookings where they are the mentor.
        // For simplicity, we'll check the role or just query both fields for now.
        // Ideally, req.user.role would dictate the query.

        if (req.user.role === 'mentor') {
            bookings = await Booking.find({ mentor: req.user.id }).populate('student', 'name email').sort({ date: 1 });
        } else {
            bookings = await Booking.find({ student: req.user.id }).populate('mentor', 'name jobTitle img').sort({ date: 1 });
        }

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Complete an interview (Mentor)
// @route   PUT /api/bookings/:id/complete
// @access  Private (Mentor)
const completeInterview = async (req, res) => {
    const { score, feedback, mentorNotes, passed, sentiment, focusArea } = req.body;
    const { id } = req.params;

    try {
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Update Booking Outcome
        // Enforce 75% Rule strictly
        const scoreNum = parseFloat(score);
        const finalPassed = !isNaN(scoreNum) && scoreNum >= 75; // Changed to >= as per user request (75% Mastery Gate)

        booking.outcome = {
            score,
            feedback,
            mentorNotes,
            passed: finalPassed,
            sentiment,
            focusArea,
            weakConcepts: req.body.weakConcepts || [] // Save here
        };
        booking.status = 'completed';
        await booking.save();

        const roadmap = await Roadmap.findOne({ student: booking.student });

        if (roadmap) {
            // Find the milestone linked to this booking
            // We search by bookingId OR current index as fallback
            let mIdx = roadmap.milestones.findIndex(m => m.bookingId && m.bookingId.toString() === id);
            if (mIdx === -1) {
                mIdx = roadmap.currentMilestoneIndex;
            }

            if (mIdx !== -1 && roadmap.milestones[mIdx]) {
                // ALWAYS Save Score & Feedback to Roadmap (History) regardless of pass/fail
                roadmap.milestones[mIdx].interviewScore = score;
                roadmap.milestones[mIdx].interviewFeedback = feedback;
                roadmap.milestones[mIdx].interviewSentiment = sentiment;
                roadmap.milestones[mIdx].interviewFocusArea = focusArea;
                // Save Weak Concepts identified by Mentor
                if (req.body.weakConcepts) {
                    roadmap.milestones[mIdx].weakConcepts = req.body.weakConcepts;
                }

                if (finalPassed) {
                    // --- PASSED ---
                    roadmap.milestones[mIdx].status = 'completed';
                    roadmap.milestones[mIdx].interviewStatus = 'passed';

                    // Unlock next milestone
                    if (mIdx + 1 < roadmap.milestones.length) {
                        roadmap.milestones[mIdx + 1].status = 'active';
                        roadmap.currentMilestoneIndex = mIdx + 1;
                        if (roadmap.milestones[mIdx + 1].sections.length > 0) {
                            roadmap.milestones[mIdx + 1].sections[0].status = 'active';
                        }
                    }

                    // Trigger Snapshot Creation
                    const { createSnapshot } = require('../controllers/studentController');
                    await createSnapshot(booking.student);

                } else {
                    // --- FAILED ---
                    roadmap.milestones[mIdx].interviewStatus = 'retake'; // "Needs Retake"
                    // Status remains 'active' (or whatever it was) so they can study and re-book
                    // We do NOT unlock the next milestone.
                }

                await roadmap.save();
            }

            // Update Student Stats (Independent of roadmap save)
            // Update Student Stats (Independent of roadmap save)
            try {
                const Student = require('../models/Student');
                const studentDoc = await Student.findOne({ user: booking.student });

                if (studentDoc) {
                    // 1. Update Stats if Passed
                    if (finalPassed) {
                        studentDoc.completedInterviews += 1;
                        const total = roadmap.milestones.length;
                        const completed = roadmap.milestones.filter(m => m.status === 'completed').length;
                        studentDoc.roadmapProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
                    }

                    // 2. Sync Weak Concepts to Student Profile (for AI Quiz)
                    if (req.body.weakConcepts && Array.isArray(req.body.weakConcepts)) {
                        req.body.weakConcepts.forEach(concept => {
                            const existing = studentDoc.weakTopics.find(t => t.topic.toLowerCase() === concept.toLowerCase());
                            if (existing) {
                                existing.missedQuestionsCount += 5; // High weight for mentor-identified weakness
                                existing.lastMissed = new Date();
                            } else {
                                studentDoc.weakTopics.push({
                                    topic: concept,
                                    missedQuestionsCount: 5,
                                    lastMissed: new Date(),
                                    source: 'mentor'
                                });
                            }
                        });
                    }

                    await studentDoc.save();
                }
            } catch (err) {
                console.error("Failed to update student stats/weak topics:", err);
            }

            // 3. TRIGGER RECOVERY PLAN (If Failed)
            if (!finalPassed && req.body.weakConcepts && req.body.weakConcepts.length > 0) {
                try {
                    const { generateRecoveryPlan } = require('./aiController');
                    const Student = require('../models/Student');
                    const studentDoc = await Student.findOne({ user: booking.student });

                    if (studentDoc) {
                        const milestoneTitle = roadmap.milestones[mIdx].title;
                        console.log(`[Recovery] Generating plan for ${studentDoc.user} on ${milestoneTitle}`);

                        const schedule = await generateRecoveryPlan(milestoneTitle, req.body.weakConcepts);

                        studentDoc.recoveryPlan = {
                            active: true,
                            sourceMilestoneId: roadmap._id, // Ideally milestone ID, but using roadmap for now
                            title: `Recovery: ${milestoneTitle}`,
                            weakAreas: req.body.weakConcepts,
                            schedule: schedule.map(d => ({
                                day: d.day,
                                topic: d.topic,
                                subtopics: d.subtopics,
                                status: d.day === 1 ? 'unlocked' : 'locked',
                                score: 0
                            })),
                            startDate: new Date(),
                            lastActiveDate: new Date()
                        };

                        await studentDoc.save();
                        console.log(`[Recovery] Plan activated for student.`);
                    }
                } catch (recError) {
                    console.error("Failed to generate/save recovery plan:", recError);
                }
            }
        }

        res.json(booking);

    } catch (error) {
        console.error("Complete Interview Error:", error);
        res.status(500).json({ message: 'Error completing interview', error: error.message });
    }
};

module.exports = { createBooking, getBookings, completeInterview };
