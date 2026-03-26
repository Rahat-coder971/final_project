const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Roadmap = require('./models/Roadmap');

dotenv.config();

const inspectStudentData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'rahathusainkhan483@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found');
            return;
        }

        const student = await Student.findOne({ user: user._id });
        const roadmap = await Roadmap.findOne({ student: user._id });

        console.log(`\nUser: ${user.name}`);
        console.log(`Roadmap Progress (in Student Doc): ${student.roadmapProgress}`);
        console.log(`Completed Interviews: ${student.completedInterviews}`);
        console.log(`Snapshots Count: ${student.snapshots.length}`);

        console.log('\n--- Snapshots ---');
        student.snapshots.forEach(s => {
            console.log(`Date: ${s.date}, Progress: ${s.progress}`);
        });

        // Recalculate what progress SHOULD be
        const total = roadmap.milestones.length;
        const completed = roadmap.milestones.filter(m => m.status === 'completed').length;
        const calcProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

        console.log(`\n--- Verification ---`);
        console.log(`Total Milestones: ${total}`);
        console.log(`Completed Milestones: ${completed}`);
        console.log(`Calculated Progress: ${calcProgress}%`);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectStudentData();
