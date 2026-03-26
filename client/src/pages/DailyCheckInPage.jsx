import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as api from '../api';
import DashboardLayout from '../components/DashboardLayout';
import StreakGrid from '../components/dashboard/StreakGrid';
import WeakConceptsBanner from '../components/dashboard/WeakConceptsBanner';
import DailyQuizLauncher from '../components/dashboard/DailyQuizLauncher';
import DailyTestModal from '../components/DailyTestModal';
import { FaFire, FaClipboardList, FaStar } from 'react-icons/fa';

const DailyCheckInPage = () => {
    const [studentData, setStudentData] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [activityData, setActivityData] = useState([]);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch student profile
            const studentRes = await api.fetchStudentProfile();
            const student = studentRes.data;
            setStudentData(student);

            const studentId = student.user?._id || student._id;
            const [analyticsRes, activityRes] = await Promise.all([
                axios.get(`http://localhost:5001/api/analytics/dashboard/${studentId}`),
                axios.get(`http://localhost:5001/api/analytics/activity-grid/${studentId}`)
            ]);
            setAnalytics(analyticsRes.data);
            setActivityData(activityRes.data.activity || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLearnClick = (weakness) => {
        // For now, just launch the daily quiz
        // Future: could navigate to specific resource or topic
        setIsQuizOpen(true);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const studentId = studentData?.user?._id || studentData?._id;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Daily Learning Check-in</h1>
                    <p className="text-gray-600">Track your progress, tackle weak concepts, and build your streak!</p>
                </div>

                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        icon={<FaFire className="text-orange-500" />}
                        label="Day Streak"
                        value={analytics?.streak?.current || 0}
                        sublabel={`Longest: ${analytics?.streak?.max || 0} days`}
                        bgColor="from-orange-50 to-red-50"
                        borderColor="border-orange-200"
                    />
                    <StatCard
                        icon={<FaClipboardList className="text-indigo-500" />}
                        label="Total Quizzes"
                        value={analytics?.totalTests || 0}
                        sublabel={`${activityData.length} active days`}
                        bgColor="from-indigo-50 to-purple-50"
                        borderColor="border-indigo-200"
                    />
                    <StatCard
                        icon={<FaStar className="text-yellow-500" />}
                        label="Avg Score"
                        value={`${analytics?.averageScore || 0}%`}
                        sublabel="Overall performance"
                        bgColor="from-yellow-50 to-amber-50"
                        borderColor="border-yellow-200"
                    />
                </div>

                {/* Streak Grid */}
                <StreakGrid activityData={activityData} />

                {/* Weak Concepts */}
                {analytics?.needsAttention && (
                    <WeakConceptsBanner
                        weaknesses={analytics.needsAttention}
                        onLearnClick={handleLearnClick}
                    />
                )}

                {/* Daily Quiz Launcher */}
                <DailyQuizLauncher
                    studentId={studentId}
                    onStart={() => setIsQuizOpen(true)}
                    onRefresh={fetchData}
                />

                {/* Daily Test Modal */}
                <DailyTestModal
                    isOpen={isQuizOpen}
                    onClose={() => setIsQuizOpen(false)}
                    onComplete={() => {
                        fetchData();
                        setIsQuizOpen(false);
                    }}
                    studentId={studentId}
                />
            </div>
        </DashboardLayout>
    );
};

const StatCard = ({ icon, label, value, sublabel, bgColor, borderColor }) => (
    <div className={`bg-gradient-to-br ${bgColor} p-6 rounded-2xl border ${borderColor} shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex items-center gap-4">
            <div className="text-4xl">{icon}</div>
            <div className="flex-1">
                <div className="text-3xl font-black text-gray-900">{value}</div>
                <div className="text-sm font-bold text-gray-700">{label}</div>
                <div className="text-xs text-gray-500">{sublabel}</div>
            </div>
        </div>
    </div>
);

export default DailyCheckInPage;
