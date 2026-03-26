import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { FaVideo, FaCheckCircle, FaStar, FaUserTie, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { fetchRoadmap, fetchBookings, fetchMentors, fetchStudentProfile } from '../api';
import ErrorBoundary from '../components/ErrorBoundary';
import PerformanceTracker from '../components/PerformanceTracker';
import DailyFocusCard from '../components/dashboard/DailyFocusCard';
import DailyTestModal from '../components/DailyTestModal';

const StudentDashboard = () => {
    const [roadmap, setRoadmap] = useState(null);
    const [upcomingSession, setUpcomingSession] = useState(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [suggestedMentors, setSuggestedMentors] = useState([]);
    const [studentProfile, setStudentProfile] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // 0. Fetch Student Profile (for Performance Tracker)
                const { data: profile } = await fetchStudentProfile();
                setStudentProfile(profile);

                // 1. Fetch Roadmap (for Progress & Assigned Mentor)
                const { data: roadmapData } = await fetchRoadmap();
                setRoadmap(roadmapData);

                // Calculate Progress
                if (roadmapData && roadmapData.weeks) {
                    let totalTasks = 0;
                    let completedTasks = 0;
                    roadmapData.weeks.forEach(week => {
                        week.tasks.forEach(task => {
                            totalTasks++;
                            if (task.completed) completedTasks++;
                        });
                    });
                    if (totalTasks > 0) {
                        setProgress(Math.round((completedTasks / totalTasks) * 100));
                    }
                }

                // 2. Fetch Bookings (for Upcoming Session)
                const { data: bookingsData } = await fetchBookings();
                const now = new Date();
                const nextSession = bookingsData
                    .filter(b => new Date(b.date) > now && b.status !== 'cancelled')
                    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

                setUpcomingSession(nextSession);

                // 3. Fetch Suggested Mentors (Mock for now, or real if available)
                try {
                    const { data: mentors } = await fetchMentors();
                    const augmentedMentors = mentors.map((m, i) => ({
                        ...m,
                        img: 10 + i, // consistent random image to match Mentors.jsx
                    }));
                    setSuggestedMentors(augmentedMentors.slice(0, 3));
                } catch (err) {
                    console.error("Failed to fetch suggested mentors", err);
                }

                // 4. Fetch Analytics (for Daily Learning Check-in)
                try {
                    const studentId = profile.user?._id || profile._id;
                    const analyticsRes = await axios.get(`http://localhost:5001/api/analytics/dashboard/${studentId}`);
                    setAnalytics(analyticsRes.data);
                } catch (err) {
                    console.error("Failed to fetch analytics", err);
                }

            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <ErrorBoundary>
            <DashboardLayout>
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

                {/* Top Section: Progress & Upcoming Session */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                    {/* Upcoming Session Card - MOVED TO LEFT */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100 ring-1 ring-blue-50 transition-transform hover:scale-[1.02]">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Session</h2>

                        {upcomingSession ? (
                            <>
                                {/* Session Details */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                                        {upcomingSession.mentor?.name?.charAt(0) || 'M'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-900 font-semibold">{upcomingSession.mentor?.name || 'Your Mentor'}</p>
                                        <p className="text-gray-500 text-sm">{upcomingSession.mentor?.email || 'Mentor Session'}</p>
                                        <div className="bg-blue-50 text-primary px-2 py-1 rounded-md text-xs font-semibold mt-1 inline-block">
                                            📅 {new Date(upcomingSession.date).toLocaleString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Join Button */}
                                <a
                                    href={`/meeting/${upcomingSession.meetingLink ? upcomingSession.meetingLink.split('/').pop() : upcomingSession._id}`}
                                    className="w-full flex justify-center items-center gap-2 bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    <FaVideo />
                                    Join Video Session
                                </a>
                            </>
                        ) : (
                            <>
                                {/* No Session State */}
                                <div className="text-center py-4">
                                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl mx-auto mb-3">
                                        📅
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4">No upcoming sessions scheduled</p>

                                    {/* Session Stats */}
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                            <div className="text-xl font-black text-blue-600">
                                                {roadmap?.mentor ? '1' : '0'}
                                            </div>
                                            <div className="text-xs text-gray-600">Active Mentor</div>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                            <div className="text-xl font-black text-green-600">0</div>
                                            <div className="text-xs text-gray-600">This Week</div>
                                        </div>
                                    </div>
                                </div>

                                <a
                                    href="/mentors"
                                    className="w-full flex justify-center items-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors mt-3"
                                >
                                    <FaCalendarAlt />
                                    Book a Session
                                </a>
                            </>
                        )}
                    </div>

                    {/* Daily Focus Card - MOVED TO RIGHT */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 transition-transform hover:scale-[1.02]">
                        {/* Motivational Banner */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-2 rounded-lg mb-4 text-center">
                            <p className="text-xs font-semibold">💡 Complete your daily quiz to strengthen weak areas!</p>
                        </div>

                        <div className="flex items-start gap-4 mb-3">
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Daily Focus</h2>
                                <p className="text-gray-600 text-sm mb-3">
                                    {analytics?.nextBestAction?.title || "Focus on Computer Science Fundamentals"}
                                </p>

                                <button
                                    onClick={() => setIsTestModalOpen(true)}
                                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                >
                                    Start Mastery Challenge
                                </button>
                            </div>

                            {/* Circular Roadmap Progress - ON RIGHT */}
                            <div className="flex flex-col items-center">
                                <div className="relative h-20 w-20">
                                    <svg className="h-full w-full transform -rotate-90">
                                        <circle cx="50%" cy="50%" r="35" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                                        <circle
                                            cx="50%" cy="50%" r="35"
                                            stroke="currentColor" strokeWidth="6"
                                            fill="transparent"
                                            strokeDasharray="219.8"
                                            strokeDashoffset={219.8 - (219.8 * progress) / 100}
                                            className="text-indigo-600 transition-all duration-1000 ease-out"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-gray-900">{progress}%</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center">Roadmap</p>
                            </div>
                        </div>

                        {/* Full-width stats below */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                <div className="text-2xl font-black text-orange-600">{analytics?.streak?.current || 0}</div>
                                <div className="text-xs text-gray-600">Day Streak</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <div className="text-2xl font-black text-blue-600">{analytics?.averageScore || 0}%</div>
                                <div className="text-xs text-gray-600">Avg. Score</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* My Mentor Section (If Assigned) */}
                {roadmap?.mentor && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">My Mentor</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
                            <div className="h-20 w-20 rounded-full bg-gray-200 overflow-hidden">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${roadmap.mentor.name}&background=random`}
                                    alt={roadmap.mentor.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">{roadmap.mentor.name}</h3>
                                <p className="text-gray-500">{roadmap.mentor.email}</p>
                                {/* If we had jobTitle etc populated, show it here. Currently populate string is just 'name email' */}
                            </div>
                            <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                                Message
                            </button>
                        </div>
                    </div>
                )}


                {/* Performance Tracker Section - Moved to separate page */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white flex justify-between items-center shadow-lg">
                        <div>
                            <h2 className="text-xl font-bold mb-2">Track Your Growth</h2>
                            <p className="opacity-90">View your detailed performance analytics, interview history, and AI insights.</p>
                        </div>
                        <a href="/performance" className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-sm">
                            View Performance
                        </a>
                    </div>
                </div>

                {/* Suggested Mentors Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Suggested Mentors</h2>
                        <a href="/mentors" className="text-sm font-medium text-primary hover:text-blue-700">View All</a>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {suggestedMentors.length > 0 ? suggestedMentors.map((mentor) => (
                            <div key={mentor._id || mentor.mentorProfileId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                <div className="p-5 flex items-start gap-4">
                                    <img
                                        src={mentor.img ? `https://i.pravatar.cc/150?img=${mentor.img}` : `https://ui-avatars.com/api/?name=${mentor.name}&background=random`}
                                        alt={mentor.name}
                                        className="h-16 w-16 rounded-full object-cover border-2 border-gray-100"
                                    />
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{mentor.name}</h3>
                                        <p className="text-sm text-gray-500">{mentor.role || mentor.jobTitle || 'Mentor'}</p>
                                        <div className="flex items-center gap-1 mt-1 text-amber-400 text-xs">
                                            <FaStar /> <span className="text-gray-600 font-medium">{mentor.rating || 5.0}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-5 pb-4">
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{mentor.bio || 'Experienced mentor ready to help you achieve your goals.'}</p>
                                    <div className="flex flex-wrap gap-2 mb-4 h-12 overflow-hidden">
                                        {mentor.skills && mentor.skills.slice(0, 3).map(skill => (
                                            <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md font-medium">{skill}</span>
                                        ))}
                                    </div>
                                    <a
                                        href="/mentors"
                                        className="block w-full text-center py-2 bg-white border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-medium"
                                    >
                                        View Profile & Book
                                    </a>
                                </div>
                            </div>
                        )) : (
                            <p>Loading mentors...</p>
                        )}
                    </div>
                </div>

                {/* Daily Test Modal */}
                <DailyTestModal
                    isOpen={isTestModalOpen}
                    onClose={() => setIsTestModalOpen(false)}
                    onComplete={async () => {
                        // Refresh analytics
                        try {
                            const studentId = studentProfile?.user?._id || studentProfile?._id;
                            const analyticsRes = await axios.get(`http://localhost:5001/api/analytics/dashboard/${studentId}`);
                            setAnalytics(analyticsRes.data);
                        } catch (err) {
                            console.error("Failed to refresh analytics", err);
                        }
                        setTimeout(() => setIsTestModalOpen(false), 2000);
                    }}
                />

            </DashboardLayout>
        </ErrorBoundary >
    );
};

export default StudentDashboard;
