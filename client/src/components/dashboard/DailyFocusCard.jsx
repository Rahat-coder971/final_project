import React from 'react';
import { FaFire, FaLock, FaPlay, FaMedal, FaExternalLinkAlt } from 'react-icons/fa';

const DailyFocusCard = ({ analytics, studentData, hasRoadmap, onStartQuiz }) => {
    // 1. Check Roadmap Status (Use prop OR fallback to studentData if prop missing)
    const isRoadmapActive = hasRoadmap !== undefined ? hasRoadmap : studentData?.roadmap;

    // 2. Check Daily Test Status
    // ...

    const nextBest = analytics?.nextBestAction;
    const resource = analytics?.recommendedResource;

    if (!isRoadmapActive) {
        return (
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FaLock size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-gray-400 uppercase text-xs font-bold tracking-wider">
                        <FaLock size={10} /> Mastery Locked
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Unlock Your Daily Mastery</h3>
                    <p className="text-gray-300 text-sm mb-6 max-w-md">
                        To get personalized daily challenges and targeted recovery plans, you need a custom Learning Roadmap.
                    </p>
                    <button className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
                        Connect with Mentor <FaExternalLinkAlt size={12} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <FaFire size={140} />
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2 text-indigo-200 uppercase text-xs font-bold tracking-wider">
                        <FaMedal size={12} /> Daily Focus
                    </div>

                    <h3 className="text-3xl font-black mb-2">
                        {nextBest?.title || "Master Your Weaknesses"}
                    </h3>

                    <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-90">
                        {nextBest?.reason || "Your mentor has flagged some key concepts. Let's fix them today."}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={onStartQuiz}
                            className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-black text-sm shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                        >
                            <FaPlay /> Start Mastery Challenge
                        </button>

                        {resource && (
                            <a
                                href={resource.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-3 rounded-xl font-bold text-sm text-white/90 border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <FaExternalLinkAlt /> Watch: {resource.title}
                            </a>
                        )}
                    </div>
                </div>

                {/* Stats / Streak Mini-view */}
                <div className="hidden md:block border-l border-white/10 pl-6">
                    <div className="mb-4">
                        <span className="block text-4xl font-black">{analytics?.streak?.current || 0}</span>
                        <span className="text-xs text-indigo-200 uppercase tracking-wide">Day Streak</span>
                    </div>
                    <div>
                        <span className="block text-4xl font-black">{analytics?.averageScore || 0}%</span>
                        <span className="text-xs text-indigo-200 uppercase tracking-wide">Avg. Mastery</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyFocusCard;
