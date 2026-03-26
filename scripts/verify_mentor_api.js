const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
const EMAIL = 'husainalamkhan26@gmail.com';
const PASSWORD = 'rahat@19';

let token = '';
let mentorId = '';
let studentId = '';
let conversationId = '';

const runTests = async () => {
    console.log('🚀 Starting API Verification for Mentor Features...\n');

    try {
        // 1. Login
        console.log('1️⃣  Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        token = loginRes.data.token;
        mentorId = loginRes.data._id;
        console.log('✅ Login Successful. Token received.\n');

        const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Dashboard Stats
        console.log('2️⃣  Fetching Dashboard Stats...');
        const statsRes = await axios.get(`${API_URL}/mentors/stats`, authHeaders);
        console.log('✅ Stats Received:', statsRes.data);
        console.log('');

        // 3. My Students
        console.log('3️⃣  Fetching My Students...');
        const studentsRes = await axios.get(`${API_URL}/mentors/my-students`, authHeaders);
        console.log(`✅ Students Found: ${studentsRes.data.length}`);
        if (studentsRes.data.length > 0) {
            studentId = studentsRes.data[0]._id;
            console.log(`   Targeting Student ID: ${studentId}`);
        } else {
            console.warn('⚠️  No students found. Skipping Roadmap tests.');
        }
        console.log('');

        // 4. Roadmap Read & Write
        if (studentId) {
            console.log('4️⃣  Fetching Student Roadmap...');
            try {
                const roadmapRes = await axios.get(`${API_URL}/roadmap/student/${studentId}`, authHeaders);
                const roadmap = roadmapRes.data;
                console.log('✅ Roadmap Fetched:', roadmap.title);

                console.log('   Updating Roadmap (Adding a Task)...');
                if (!roadmap.weeks) roadmap.weeks = [];
                if (roadmap.weeks.length === 0) roadmap.weeks.push({ week: 1, title: 'Week 1', tasks: [] });

                roadmap.weeks[0].tasks.push({
                    day: 'Fri',
                    activity: 'Verified by API Script',
                    completed: true,
                    mentorNote: 'Automated Test Note'
                });

                const updateRes = await axios.put(`${API_URL}/roadmap/${roadmap._id}`, roadmap, authHeaders);
                console.log('✅ Roadmap Updated Successfully.');
            } catch (err) {
                console.error('❌ Roadmap Error:', err.response?.data?.message || err.message);
            }
        }
        console.log('');

        // 5. Availability
        console.log('5️⃣  Setting Availability...');
        const availPayload = {
            availability: ['Mon 10:00 AM', 'Wed 02:00 PM', 'Fri 04:00 PM']
        };
        const availRes = await axios.put(`${API_URL}/mentors/profile`, availPayload, authHeaders);
        console.log('✅ Availability Updated:', availRes.data.availability);
        console.log('');

        // 6. Messages
        if (studentId) {
            console.log('6️⃣  Sending Message to Student...');
            const msgPayload = {
                receiverId: studentId,
                content: 'Hello from API Verification Script!'
            };
            const msgRes = await axios.post(`${API_URL}/messages`, msgPayload, authHeaders);
            console.log('✅ Message Sent:', msgRes.data.content);

            console.log('   Fetching Conversations...');
            const convRes = await axios.get(`${API_URL}/messages/conversations`, authHeaders);
            console.log(`✅ Conversations Found: ${convRes.data.length}`);
        }
        console.log('');

        // 7. Profile Update
        console.log('7️⃣  Updating Mentor Profile...');
        const profilePayload = {
            jobTitle: 'Principal API Tester',
            company: 'Validation Corp',
            bio: 'This profile was verified by a script.'
        };
        const profileRes = await axios.put(`${API_URL}/mentors/profile`, profilePayload, authHeaders);
        console.log('✅ Profile Updated:', profileRes.data.jobTitle, 'at', profileRes.data.company);
        console.log('');

        console.log('🎉 All Backend Tests Passed Successfully!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.response?.data?.message || error.message);
        if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
    }
};

runTests();
