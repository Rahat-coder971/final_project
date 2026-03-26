import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import Roadmap from './pages/Roadmap';
import Mentors from './pages/Mentors';
import AiTools from './pages/AiTools';
import MentorDashboard from './pages/MentorDashboard';
import MessagesPage from './pages/MessagesPage';
import PerformancePage from './pages/PerformancePage';
import DailyCheckInPage from './pages/DailyCheckInPage';
import MeetingNotes from './pages/MeetingNotes';
import VideoRoom from './components/VideoRoom';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/daily-check-in" element={<DailyCheckInPage />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/mentors" element={<Mentors />} />
          <Route path="/ai-tools" element={<AiTools />} />
          <Route path="/meeting-notes" element={<MeetingNotes />} />
        </Route>

        {/* Mentor Routes */}
        <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
          <Route path="/mentor-dashboard" element={<MentorDashboard />} />
        </Route>

        {/* Shared Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student', 'mentor']} />}>
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/meeting/:roomId" element={<VideoRoom />} />
        </Route>
        {/* Add more routes here */}
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
