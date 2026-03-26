const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Roadmap = require('./models/Roadmap');

dotenv.config();

const fixUserData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'rahathusainkhan483@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`Fixing data for: ${user.name}`);

        // 1. Fix Roadmap (Lock Milestone 3)
        const roadmap = await Roadmap.findOne({ student: user._id });
        if (roadmap) {
            // Milestone 2 Failed, so it should be Active (Retake)
            // Milestone 3 should be Locked

            console.log('Current M3 Status:', roadmap.milestones[2].status);

            roadmap.milestones[2].status = 'locked';

            // Also ensure M2 is active
            if (roadmap.milestones[1].status !== 'active') {
                roadmap.milestones[1].status = 'active';
            }

            // Reset current index to 1 (Milestone 2) if it moved to 2
            if (roadmap.currentMilestoneIndex > 1) {
                roadmap.currentMilestoneIndex = 1;
            }

            await roadmap.save();
            console.log('✅ Roadmap updated: Milestone 3 Locked, M2 Active, Index Reset.');
        }

        // 2. Fix Student Snapshots (Add missing history)
        const student = await Student.findOne({ user: user._id });
        if (student) {
            if (student.snapshots.length === 0) {
                console.log('Adding missing snapshots...');

                // Add a "Start" snapshot
                student.snapshots.push({
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    progress: 0,
                    skillLevels: student.skillLevels
                });

                // Add a "Milestone 1 Completed" snapshot
                student.snapshots.push({
                    date: new Date(),
                    progress: 33,
                    skillLevels: student.skillLevels
                });

                await student.save();
                console.log('✅ Snapshots added.');
            } else {
                console.log('Snapshots already exist, skipping.');
            }
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

fixUserData();
