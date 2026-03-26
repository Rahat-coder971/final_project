import React, { useEffect, useState } from 'react';
import { FaUserGraduate, FaCalendarCheck, FaClock, FaPlay, FaHistory } from 'react-icons/fa';
import * as api from '../api';

const DashboardOverview = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        todaysSessions: 0,
        hoursMentored: 0
    });
    const [liveQueue, setLiveQueue] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.fetchMentorStats();
                setStats(data.stats);
                setLiveQueue(data.liveQueue);
                setRecentActivity(data.recentActivity);
            } catch (error) {
                console.error("Error fetching mentor stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Students</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full text-xl">
                        <FaUserGraduate />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Today's Sessions</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todaysSessions}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-full text-xl">
                        <FaCalendarCheck />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Hours Mentored</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.hoursMentored}h</p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-full text-xl">
                        <FaClock />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Queue */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        Live Queue (Today)
                    </h2>

                    {liveQueue.length > 0 ? (
                        liveQueue.map((session) => (
                            <div key={session._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                                        {/* Avatar placeholder */}
                                        <img src={`https://ui-avatars.com/api/?name=${session.student?.name || 'Unknown'}&background=random`} alt={session.student?.name || 'Unknown'} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{session.student?.name || 'Unknown Student'}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <FaClock className="text-gray-400" />
                                            {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={session.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <FaPlay className="text-xs" /> Start Meeting
                                </a>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center text-gray-500">
                            No sessions scheduled for today. Relax! ☕
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-6">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex gap-3">
                                <div className="mt-1">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800 font-medium">{activity.text}</p>
                                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
