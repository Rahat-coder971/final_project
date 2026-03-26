const axios = require('axios');
const mongoose = require('mongoose');

const testFeature = async () => {
    try {
        console.log("1. Logging in as Dummy Student...");
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'dummy_student@example.com',
            password: 'password123' // from seed_data.js
        });

        const token = loginRes.data.token;
        const studentId = loginRes.data._id;
        console.log("-> Login successful. Token received.");

        console.log("\n2. Simulating Canvas Capture (Whiteboard Base64 Image)...");
        // A minimal valid 1x1 pixel PNG
        const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

        console.log("\n3. Calling /api/ai/whiteboard-notes to generate notes via Interfaze.ai...");
        const generateRes = await axios.post('http://localhost:5001/api/ai/whiteboard-notes', {
            meetingId: 'room_12345',
            image: dummyImage
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("-> AI Response Received & Saved!");
        console.log("-> Generated Content:\n", generateRes.data.notes.content);

        console.log("\n4. Fetching from /api/ai/notes/:studentId to verify History page...");
        const historyRes = await axios.get(`http://localhost:5001/api/ai/notes/${studentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`-> History contains ${historyRes.data.length} saved notes.`);
        console.log("-> Latest note meetingId:", historyRes.data[0].meetingId);

        console.log("\n✅ Test completed successfully!");
    } catch (error) {
        console.error("Test failed:", error.response ? error.response.data : error.message);
    }
}

testFeature();
