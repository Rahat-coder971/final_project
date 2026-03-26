import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt } from 'react-icons/fa';

const InterviewLog = ({ roadmap }) => {
    // Extract milestones with interview data
    const completedMilestones = roadmap?.milestones?.filter(m => m.interviewStatus !== 'pending' || m.status === 'completed') || [];

    // Find next upcoming thing
    const activeMilestone = roadmap?.milestones?.find(m => m.status === 'active');
    const nextInterview = activeMilestone ? {
        title: activeMilestone.title + " Assessment",
        date: "TBD", // In a real app, this would link to Booking
        type: "Milestone Review"
    } : null;

    return (
        <div className="space-y-6">
            {/* Upcoming Agenda Box */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <FaClock size={150} />
                </div>

                <h3 className="text-indigo-100 font-medium text-sm uppercase tracking-wider mb-1">Upcoming Agenda</h3>
                <h2 className="text-2xl font-bold mb-4">{nextInterview ? nextInterview.title : "No Upcoming Interviews"}</h2>

                <div className="flex items-center gap-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm w-fit">
                    <FaCalendarAlt className="text-indigo-200" />
                    <span className="font-medium">{nextInterview ? "Schedule via Mentors Tab" : "All Caught Up!"}</span>
                </div>
            </div>

            {/* Past Interviews List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Interview History</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4 font-bold">Milestone</th>
                                <th className="px-6 py-4 font-bold">Score</th>
                                <th className="px-6 py-4 font-bold">Status</th>
                                <th className="px-6 py-4 font-bold">Feedback</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {completedMilestones.length > 0 ? completedMilestones.map((m, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{m.title}</td>
                                    <td className="px-6 py-4 text-gray-600 font-bold">{m.interviewScore}%</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold
                                            ${m.interviewStatus === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {m.interviewStatus === 'passed' ? <FaCheckCircle /> : <FaTimesCircle />}
                                            {m.interviewStatus.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={m.interviewFeedback}>
                                        {m.interviewFeedback || "No feedback recorded."}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400 italic">
                                        No completed interviews yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InterviewLog;
