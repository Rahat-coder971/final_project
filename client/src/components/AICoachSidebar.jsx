import React, { useState, useEffect } from 'react';
import { FaRobot, FaLightbulb, FaSpinner } from 'react-icons/fa';
import { fetchAICoachFeedback } from '../api';

const AICoachSidebar = ({ studentId, studentData, roadmapData }) => {
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(true);

    // Derived Stats
    const studentName = studentData?.user?.name || "Student";
    const completedMilestones = roadmapData?.milestones?.filter(m => m.status === 'completed').length || 0;
    const totalMilestones = roadmapData?.milestones?.length || 0;
    const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    useEffect(() => {
        const getAdvice = async () => {
            try {
                const res = await fetchAICoachFeedback();
                if (res.data && res.data.advice) {
                    setAdvice(res.data.advice);
                }
            } catch (err) {
                console.error("Failed to fetch coach advice", err);
                setAdvice("I'm having trouble analyzing your data right now. Keep pushing forward!");
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            getAdvice();
        }
    }, [studentId]);

    return (
        <div className="bg-white h-full flex flex-col gap-6">
            {/* 1. Profile Summary */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {studentName.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{studentName}</h3>
                    <p className="text-xs text-gray-500">Aspiring Developer</p>
                </div>
            </div>

            {/* 2. Key Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-xl text-center border border-blue-100">
                    <span className="block text-2xl font-bold text-blue-700">{completedMilestones}/{totalMilestones}</span>
                    <span className="text-xs text-blue-500 uppercase font-bold">Milestones</span>
                </div>
                <div className="p-3 bg-green-50 rounded-xl text-center border border-green-100">
                    <span className="block text-2xl font-bold text-green-700">{progressPercent}%</span>
                    <span className="text-xs text-green-500 uppercase font-bold">Complete</span>
                </div>
            </div>

            {/* 3. AI Coach Advice */}
            <div className="bg-gradient-to-b from-indigo-50 to-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
                        <FaRobot size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Coach's Insight</h4>
                    </div>
                </div>

                <div className="relative min-h-[100px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-6 text-indigo-400">
                            <FaSpinner className="animate-spin mb-2" size={20} />
                            <span className="text-xs">Analyzing...</span>
                        </div>
                    ) : (
                        <div className="relative">
                            <FaLightbulb className="absolute -top-1 -right-1 text-amber-400 text-lg opacity-50" />
                            <p className="text-gray-700 text-sm leading-relaxed italic">
                                "{advice}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AICoachSidebar;
