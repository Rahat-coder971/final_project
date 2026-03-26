import React, { useState, useEffect } from 'react';
import axios from 'axios';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    RadialBarChart, RadialBar, BarChart, Bar, Legend
} from 'recharts';
import { FaChartLine, FaBriefcase, FaCheckCircle, FaStar, FaArrowUp, FaArrowDown, FaExclamationTriangle } from 'react-icons/fa';
import MentorFeedback from './MentorFeedback';
import WeaknessAnalysis from './dashboard/WeaknessAnalysis';

const PerformanceTracker = ({ studentData, roadmapData, isMentorView = false }) => {
    const [analytics, setAnalytics] = useState(null);

    const fetchAnalytics = async () => {
        if (studentData?._id || studentData?.user?._id) {
            try {
                const id = studentData.user?._id || studentData._id;
                const res = await axios.get(`http://localhost:5001/api/analytics/dashboard/${id}`);
                setAnalytics(res.data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            }
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [studentData]);

    // 1. Skills Data (Now comes from Roadmap Milestones via Backend)
    const skillsData = studentData?.skills || [];

    // 2. Readiness Data
    const readinessScore = studentData?.readiness || 0;
    const readinessData = [{ name: 'Job Readiness', uv: readinessScore, fill: '#6366f1' }];

    // Helper to get color based on score
    const getScoreColor = (score) => {
        if (score >= 75) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-500';
    };

    const getScoreBg = (score) => {
        if (score >= 75) return 'bg-green-100';
        if (score >= 50) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    const scoreToColorClass = (score) => {
        if (score >= 75) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Helper States
    // (Removed Daily Test Modal state - moved to dashboard)

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaChartLine className="text-indigo-600" /> Performance Dashboard
            </h3>

            {/* Focus Areas Summary - REMOVED per user request */}

            {/* 2. Insights & Recovery Row */}
            {analytics && (
                <div className="grid grid-cols-1 gap-6">
                    {/* Velocity Chart (Trends) - Full Width Now */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="font-bold text-gray-700">Learning Velocity</h4>
                                <p className="text-xs text-gray-400">Your daily mastery trend</p>
                            </div>
                        </div>
                        <div className="h-64 w-full">
                            {analytics.velocity && analytics.velocity.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.velocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                            tickFormatter={(dateStr) => {
                                                const d = new Date(dateStr);
                                                return `${d.getDate()}/${d.getMonth() + 1}`;
                                            }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 11, fill: '#6b7280' }}
                                            domain={[0, 100]}
                                            ticks={[0, 25, 50, 75, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                            }}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                            formatter={(value) => [`${value}%`, 'Score']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#4f46e5"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorScore)"
                                            activeDot={{ r: 6, strokeWidth: 0, fill: '#312e81' }}
                                            dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#4f46e5' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <FaChartLine className="text-3xl mb-2 opacity-20" />
                                    <p className="text-sm">Start your daily challenges to see trends!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Skill Growth & Readiness Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Topic Growth Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="font-bold text-gray-700">Weekly Skill Growth</h4>
                            <p className="text-xs text-gray-400">Improvement vs. Last week</p>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        {analytics?.topicGrowth && analytics.topicGrowth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={analytics.topicGrowth}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="topic"
                                        type="category"
                                        width={100}
                                        tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                    <Bar dataKey="previous" name="Last Week" fill="#e5e7eb" radius={[0, 4, 4, 0]} barSize={8} />
                                    <Bar dataKey="current" name="This Week" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <FaChartLine className="text-3xl mb-2 opacity-20" />
                                <p className="text-sm">Not enough data for growth comparison.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Job Readiness */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                    <h4 className="font-bold text-gray-700 mb-4 z-10">Job Readiness</h4>
                    <div className="h-48 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                cx="50%" cy="50%"
                                innerRadius="70%" outerRadius="100%"
                                barSize={15}
                                data={readinessData}
                                startAngle={180} endAngle={0}
                            >
                                <RadialBar
                                    minAngle={15}
                                    label={{ position: 'insideStart', fill: '#fff', fontSize: '0px' }}
                                    background
                                    clockWise
                                    dataKey="uv"
                                    cornerRadius={10}
                                />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                            <div className="text-5xl font-extrabold text-indigo-600">{readinessScore}%</div>
                            <span className="text-sm text-gray-400 font-medium mt-1">Ready to Apply</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Detailed Skill Proficiency */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-gray-700">Detailed Skill Proficiency</h4>
                </div>
                {skillsData.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skillsData.map((skill, index) => (
                            <div key={index} className={`flex items-center p-4 border border-gray-100 rounded-xl 
                                ${skill.status === 'locked' ? 'bg-gray-100 opacity-60' : 'hover:shadow-md transition-shadow bg-gray-50/30'}`}>
                                <div className={`p-3 rounded-full mr-4 ${skill.status === 'locked' ? 'bg-gray-200' : getScoreBg(skill.A)}`}>
                                    {skill.status === 'locked' ? (
                                        <FaBriefcase className="text-gray-400 text-lg" />
                                    ) : (
                                        <FaStar className={`${getScoreColor(skill.A)} text-lg`} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h5 className="font-bold text-gray-800 text-sm truncate" title={skill.subject}>
                                        {skill.subject}
                                    </h5>
                                    {skill.status === 'locked' ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">LOCKED</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${scoreToColorClass(skill.A)}`}
                                                    style={{ width: `${skill.A}%` }}
                                                ></div>
                                            </div>
                                            <span className={`text-xs font-bold ${getScoreColor(skill.A)}`}>{skill.A}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">
                        <p>No skills data available yet.</p>
                    </div>
                )}
            </div>

            {/* Mentor's Feedback Section */}
            <MentorFeedback studentData={studentData} isMentorView={isMentorView} />

        </div>
    );
};

// Focus Area Card Component
const FocusAreaCard = ({ title, count, color, icon }) => {
    const colorClasses = {
        green: 'from-green-50 to-emerald-50 border-green-200 text-green-700',
        yellow: 'from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700',
        red: 'from-red-50 to-rose-50 border-red-200 text-red-700'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3">
                <div className="text-3xl">{icon}</div>
                <div>
                    <div className="text-3xl font-black">{count}</div>
                    <div className="text-sm font-bold">{title}</div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceTracker;
