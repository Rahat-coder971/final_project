const mongoose = require('mongoose');
const User = require('./models/User');
const Roadmap = require('./models/Roadmap');
const Student = require('./models/Student');
require('dotenv').config();

const runDebug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const studentEmail = 'rahathusainkhan483@gmail.com';
        const mentorEmail = 'blogify.hub7789@gmail.com';

        // 1. Find Users
        const studentUser = await User.findOne({ email: studentEmail });
        const mentorUser = await User.findOne({ email: mentorEmail });

        console.log('--- USERS ---');
        console.log('Student User:', studentUser ? `${studentUser.name} (${studentUser._id})` : 'NOT FOUND');
        console.log('Mentor User:', mentorUser ? `${mentorUser.name} (${mentorUser._id})` : 'NOT FOUND');

        if (!studentUser) {
            console.log('Student not found, aborting.');
            return;
        }

        // 2. Find Student Profile
        const studentProfile = await Student.findOne({ user: studentUser._id });
        console.log('\n--- STUDENT PROFILE ---');
        console.log('Student Profile:', studentProfile ? `${studentProfile.name} (${studentProfile._id})` : 'NOT FOUND');
        if (studentProfile) {
            console.log('Linked User ID in Profile:', studentProfile.user);
        }

        // 3. Find All Roadmaps for Student User ID
        const userRoadmaps = await Roadmap.find({ student: studentUser._id });
        console.log(`\n--- ROADMAPS for User ID ${studentUser._id} ---`);
        console.log(`Count: ${userRoadmaps.length}`);
        userRoadmaps.forEach(r => {
            console.log(`- ID: ${r._id}`);
            console.log(`  Title: ${r.title}`);
            console.log(`  Structure: ${r.milestones?.length > 0 ? 'Milestones (New)' : 'Weeks (Old)'}`);
            console.log(`  IsGenerated: ${r.isGenerated}`);
            console.log(`  Mentor: ${r.mentor}`);
        });

        // 4. Find All Roadmaps for Student Profile ID (just in case they were linked wrong)
        if (studentProfile) {
            const profileRoadmaps = await Roadmap.find({ student: studentProfile._id });
            /* Only log if different from userRoadmaps to avoid noise, 
               but actually let's just log if any exist because that would be a bug 
               (Schema says student ref is User, but maybe some code used Profile ID) */
            if (profileRoadmaps.length > 0 && String(studentUser._id) !== String(studentProfile._id)) {
                console.log(`\n!!! FOUND ROADMAPS LINKED TO PROFILE ID ${studentProfile._id} INSTEAD OF USER ID !!!`);
                profileRoadmaps.forEach(r => {
                    console.log(`- ID: ${r._id}, Title: ${r.title}`);
                });
            }
        }

    } catch (err) {
        console.error('Debug Failed:', err);
    } finally {
        await mongoose.connection.close();
    }
};

runDebug();
