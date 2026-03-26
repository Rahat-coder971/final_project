import React, { useState, useEffect } from 'react';
import * as api from '../api';
import PerformanceTracker from '../components/PerformanceTracker';
import AICoachSidebar from '../components/AICoachSidebar';
import DetailedProgressTracker from '../components/DetailedProgressTracker';
import DashboardLayout from '../components/DashboardLayout'; // Added Standard Layout

import DailyTestModal from '../components/DailyTestModal';
import RecoveryChallengeCard from '../components/RecoveryChallengeCard';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import MistakeBank from '../components/dashboard/MistakeBank';
import ReadinessGauge from '../components/dashboard/ReadinessGauge';
import DailyScoreChart from '../components/dashboard/DailyScoreChart';
import TopicStrengthChart from '../components/dashboard/TopicStrengthChart';

import { FaFire, FaCheckCircle, FaBrain, FaExclamationTriangle, FaRobot, FaChartLine, FaLayerGroup } from 'react-icons/fa';
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

import WeaknessAnalysis from '../components/dashboard/WeaknessAnalysis'; // Import WeaknessAnalysis

const PerformancePage = ({ studentIdProp, isMentorView = false }) => {
    const [studentData, setStudentData] = useState(null);
    const [roadmapData, setRoadmapData] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [activityData, setActivityData] = useState(null); // New State

    const [loading, setLoading] = useState(true);
    const [isDailyTestOpen, setIsDailyTestOpen] = useState(false); // Kept this state as it's used by DailyTestModal

    const [activeRecoveryDay, setActiveRecoveryDay] = useState(null);
    const [recoveryQuestions, setRecoveryQuestions] = useState([]);
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Determine Target ID
                const targetId = isMentorView ? studentIdProp : 'me';
                console.log("Fetching data for:", targetId);

                // 1. Fetch Student Profile
                const studentRes = isMentorView
                    ? await api.fetchStudentProfileById(targetId)
                    : await api.fetchStudentProfile();

                if (!studentRes.data) throw new Error("No student data");
                const sData = studentRes.data;
                setStudentData(sData);

                // 2. Fetch Roadmap
                try {
                    const roadmapRes = isMentorView
                        ? await api.fetchStudentRoadmap(studentIdProp)
                        : await api.fetchRoadmap();
                    setRoadmapData(roadmapRes.data);
                } catch (e) {
                    console.warn("Roadmap fetch failed", e);
                }

                // 3. Fetch Analytics & Activity
                const analyticsTargetId = sData.user?._id || sData.user || sData._id;

                // Parallel Fetch for Speed
                const [analyticsRes, activityRes] = await Promise.all([
                    api.fetchAnalyticsDashboard(analyticsTargetId),
                    api.fetchActivityGrid(analyticsTargetId)
                ]);

                console.log("Analytics Data:", analyticsRes.data);
                setAnalytics(analyticsRes.data);
                setActivityData(activityRes.data);

            } catch (error) {
                console.error("Failed to load performance data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentIdProp, isMentorView]);

    const handleStartRecoveryQuiz = async (day) => {
        try {
            setLoading(true);
            const res = await api.startRecoveryDay(day);
            setRecoveryQuestions(res.data.questions);
            setActiveRecoveryDay(day);
            setIsRecoveryModalOpen(true);
        } catch (error) {
            console.error("Failed to start recovery quiz", error);
            alert("Could not start quiz. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Performance Command Center...</div>;
    if (!studentData || !roadmapData) return <div className="p-10 text-center">Data not available.</div>;

    const targetStudentId = studentData.user?._id || studentData.user || studentData._id;
    const skillsData = studentData.skills || [];
    const readinessScore = studentData.readiness || 0; // Assuming backend calculates this or we derive it

    // Content Wrapper
    const Layout = isMentorView ? ({ children }) => <div className="p-6">{children}</div> : DashboardLayout;

    return (
        <Layout>
            <div className="p-6 max-w-[1600px] mx-auto bg-gray-50 min-h-screen">

                {/* Header Section */}
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-800 tracking-tight">
                            Performance <span className="text-indigo-600">Command Center</span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            Deep dive into your learning patterns, consistency, and mastery.
                        </p>
                    </div>
                    {/* Top Stats Row (Mini) */}
                    <div className="flex gap-4">
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 uppercase font-bold">Streak</div>
                            <div className="text-xl font-black text-orange-500 flex items-center justify-center gap-1">
                                <FaFire /> {studentData.streak?.current || 0}
                            </div>
                        </div>
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-center">
                            <div className="text-xs text-gray-400 uppercase font-bold">Velocity</div>
                            <div className="text-xl font-black text-green-500 flex items-center justify-center gap-1">
                                <FaChartLine />
                                {analytics?.growth && analytics.growth.length > 1 ? (analytics.growth[analytics.growth.length - 1].score - analytics.growth[analytics.growth.length - 2].score) : 0}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* COL 1: Main Feed (Width 8) */}
                    <div className="md:col-span-8 flex flex-col gap-6">

                        {/* 1. Recovery Challenge (Top Priority) */}
                        <RecoveryChallengeCard
                            studentId={targetStudentId}
                            onStartQuiz={handleStartRecoveryQuiz}
                        />

                        {/* 2. Activity Heatmap (Consistency) */}
                        {activityData && (
                            <ActivityHeatmap
                                activityData={activityData.activity}
                                totalDays={activityData.totalActiveDays}
                            />
                        )}

                        {/* 3. Skill Analysis Row (Radar + Topic Strength) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Radar Chart (Balance) */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <FaLayerGroup className="text-indigo-500" /> Skill Balance (Radar)
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar
                                                name="You"
                                                dataKey="A"
                                                stroke="#4f46e5"
                                                strokeWidth={3}
                                                fill="#4f46e5"
                                                fillOpacity={0.3}
                                            />
                                            <Tooltip />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Topic Strength Bar Chart (Simple) */}
                            <TopicStrengthChart skillsData={skillsData} />
                        </div>

                        {/* 4. Daily Score Trend (New Line Chart) */}
                        <div className="h-80">
                            {activityData && <DailyScoreChart activityData={activityData.activity} />}
                        </div>

                        {/* 4. Learning Velocity Graph (Wide) */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <FaChartLine className="text-green-500" /> Learning Velocity Trend
                            </h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics?.growth || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="month" hide />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none' }} />
                                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* COL 2: Sidebar Insights (Width 4) */}
                    <div className="md:col-span-4 flex flex-col gap-6">

                        {/* 1. Readiness Gauge */}
                        <ReadinessGauge score={parseInt(studentData.readiness || 55)} />

                        {/* 2. AI Coach Insight (Card) */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <FaRobot className="absolute bottom-[-20px] right-[-20px] text-white opacity-10 text-9xl" />
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                                    <FaRobot /> AI Coach Insight
                                </h3>
                                <p className="text-indigo-100 text-sm leading-relaxed italic">
                                    "{studentData.dailyInsight?.text || "Consistency in small steps leads to giant leaps. Focus on your weak areas today."}"
                                </p>
                            </div>
                        </div>

                        {/* 3. Mistake Bank (New) */}
                        <MistakeBank studentId={targetStudentId} />

                        {/* 4. Mentor Flagged Topics (Legacy Support) */}
                        {analytics?.needsAttention && analytics.needsAttention.some(n => n.source.toLowerCase().includes('mentor')) && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-md font-bold text-red-700 flex items-center gap-2 mb-2">
                                    <FaExclamationTriangle /> Urgent Flags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {analytics.needsAttention.filter(n => n.source.toLowerCase().includes('mentor')).map((item, idx) => (
                                        <span key={idx} className="bg-white border border-red-200 text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                            {item.topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Recovery Quiz Modal */}
                <DailyTestModal
                    isOpen={isRecoveryModalOpen}
                    onClose={() => setIsRecoveryModalOpen(false)}
                    preloadedQuestions={recoveryQuestions}
                    recoveryDay={activeRecoveryDay}
                    onComplete={(result) => {
                        // Refresh data to update the card
                        // fetchData(); // This is undefined here because fetchData is inside useEffect. 
                        // Fix: move fetchData out or force reload. 
                        // Better: Just close modal and maybe set a flag to re-trigger effect.
                        window.location.reload(); // Quick fix for now to ensure fresh state
                    }}
                />
            </div>
        </Layout>
    );
};

export default PerformancePage;
