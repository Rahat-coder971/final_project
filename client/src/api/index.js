import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5001/api',
});

// Add a request interceptor to include the auth token in headers
API.interceptors.request.use((req) => {
    if (localStorage.getItem('token')) {
        req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }
    return req;
});

export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const googleSignIn = (token) => API.post('/auth/google', { access_token: token });
export const githubSignIn = (code) => API.post('/auth/github', { code });
export const firebaseSignIn = (userData) => API.post('/auth/firebase-signin', userData);
export const createBooking = (bookingData) => API.post('/bookings', bookingData);
export const fetchBookings = () => API.get('/bookings');
export const completeInterview = (bookingId, data) => API.put(`/bookings/${bookingId}/complete`, data);
export const fetchMentors = () => API.get('/users/mentors');
export const fetchRoadmap = () => API.get('/roadmap');
export const fetchStudentRoadmap = (studentId) => API.get(`/roadmap/student/${studentId}`);
export const updateRoadmap = (id, data) => API.put(`/roadmap/${id}`, data);
export const generateRoadmap = (roadmapData) => API.post('/roadmap/generate', roadmapData);
// Mentor API
export const fetchMentorProfile = () => API.get('/mentors/me');
export const updateMentorProfile = (data) => API.put('/mentors/profile', data);
export const fetchMentorStats = () => API.get('/mentors/stats');
export const fetchMyStudents = () => API.get('/mentors/my-students');

// Student API
export const fetchStudentProfile = () => API.get('/students/me');
export const fetchStudentProfileById = (id) => API.get(`/students/${id}`);
export const updateStudentSkills = (id, skills) => API.put(`/students/${id}/skills`, { skills });

// Messaging API
export const sendMessage = (data) => API.post('/messages', data);
export const fetchMessages = (otherUserId) => API.get(`/messages/${otherUserId}`);
export const fetchConversations = () => API.get('/messages/conversations');

export const summarizeVideo = (data) => API.post('/ai/summarize-video', data);
export const generatePerformanceSummary = (studentId) => API.post('/ai/performance-summary', { studentId });
export const fetchAICoachFeedback = () => API.post('/ai/coach');
export const chatWithBot = (data) => API.post('/ai/chat', data);

// AI File Features
export const extractPdfContext = (formData) => API.post('/ai/extract-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const sendPdfChat = (data) => API.post('/ai/pdf-chat', data);
export const generateResumeScore = (formData) => API.post('/ai/resume-score', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

// Roadmap Quiz & Unlock
export const submitQuiz = (roadmapId, milestoneIdx, sectionIdx, answers) => API.post(`/roadmap/${roadmapId}/section/${milestoneIdx}/${sectionIdx}/quiz`, { answers });
export const unlockRoadmap = (roadmapId) => API.put(`/roadmap/${roadmapId}/unlock`);

// Analytics & Daily Test
// Analytics & Daily Test
export const generateDailyTest = () => API.get('/students/daily-quiz');
export const submitDailyTest = (data) => API.post('/students/daily-quiz', data);
export const fetchAnalyticsDashboard = (studentId) => API.get(`/analytics/dashboard/${studentId}`);
export const fetchActivityGrid = (studentId) => API.get(`/analytics/activity-grid/${studentId}`);
export const fetchMistakeBank = (studentId) => API.get(`/analytics/mistakes/${studentId}`);

// Weekly Recovery Challenge
export const fetchRecoveryChallenge = () => API.get('/students/recovery-challenge');
export const startRecoveryDay = (day) => API.post('/students/recovery-challenge/start-day', { day });
export const submitRecoveryDay = (data) => API.post('/students/recovery-challenge/submit-day', data);

export default API;
