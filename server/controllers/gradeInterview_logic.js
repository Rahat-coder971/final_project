
// @desc    Grade a student interview
// @route   POST /api/mentors/grade-interview
// @access  Private (Mentor only)
const gradeInterview = async (req, res) => {
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
