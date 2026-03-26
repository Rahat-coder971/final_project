const axios = require('axios');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5001/api';

// Database Connection (Optional, if we want to clean up directly, but simpler to just use API)
// We'll rely on API for now.

async function verifyDailyQuiz() {
    try {
        console.log("Starting Daily Quiz Verification...");

        // 1. Register/Login Student
        const email = `quiz_tester_${Date.now()}@test.com`;
        const password = 'password123';

        console.log(`Creating test student: ${email}`);
        let token;
        try {
            const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                name: 'Quiz Tester',
                email,
                password,
                role: 'student'
            });
            token = regRes.data.token;
        } catch (e) {
            console.log("Registration failed, trying login...");
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, { email, password });
            token = loginRes.data.token;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1.5 Debug Check
        try {
            console.log("Checking Debug Endpoint...");
            const debugRes = await axios.get(`${BASE_URL}/students/test/debug`);
            console.log("Debug Response:", debugRes.data);
        } catch (e) {
            console.log("Debug Endpoint Failed (Expected if auth required, but it's public?)", e.message);
        }

        // 2. Fetch Daily Quiz
        console.log("\nFetching Daily Quiz...");
        const quizRes = await axios.get(`${BASE_URL}/students/daily-quiz`, config);

        if (quizRes.data.completed) {
            console.log("Quiz already completed for today. Cannot proceed with full test.");
            return;
        }

        const questions = quizRes.data.questions;
        console.log(`Received ${questions.length} questions.`);
        console.log("First question:", questions[0].question);

        // 3. Submit Quiz (Random Answers)
        console.log("\nSubmitting Quiz Answers...");
        // Generate random answers (indices 0-3)
        const answers = questions.map(() => Math.floor(Math.random() * 4));
        console.log("Submitting answers:", answers);

        const submitRes = await axios.post(`${BASE_URL}/students/daily-quiz`, { answers }, config);
        console.log("Submission Result:", submitRes.data);

        if (submitRes.data.results.length !== questions.length) {
            console.error("ERROR: Result count mismatch!");
        } else {
            console.log("SUCCESS: Submission processed correctly.");
        }

        // 4. Verify Quiz is Marked Completed
        console.log("\nVerifying Completion State...");
        const checkRes = await axios.get(`${BASE_URL}/students/daily-quiz`, config);
        if (checkRes.data.completed) {
            console.log("SUCCESS: Quiz correctly marked as completed.");
        } else {
            console.error("ERROR: Quiz should be marked completed!");
        }

    } catch (error) {
        console.error("Verification Failed:", JSON.stringify(error.response ? error.response.data : error.message, null, 2));
    }
}

verifyDailyQuiz();
