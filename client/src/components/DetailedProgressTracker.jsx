import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

const DetailedProgressTracker = ({ roadmap }) => {
    // If no roadmap, show nothing
    if (!roadmap || !roadmap.milestones) return null;

    // State to toggle accordions for each milestone
    // Default: Open the current milestone, others closed? Or all open?
    // Let's Open All for "Detailed History" feel, or just the active/completed ones.
    const [openMilestones, setOpenMilestones] = useState(
        roadmap.milestones.map((_, idx) => idx === roadmap.currentMilestoneIndex || idx < roadmap.currentMilestoneIndex)
    );

    const toggleMilestone = (index) => {
        setOpenMilestones(prev => {
            const newState = [...prev];
            newState[index] = !newState[index];
            return newState;
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                    Detailed Learning Path
                </h3>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {roadmap.milestones.length} Milestones
                </span>
            </div>

            <div className="divide-y divide-gray-100">
                {roadmap.milestones.map((milestone, mIndex) => (
                    <div key={mIndex} className="bg-white">
                        {/* Milestone Header */}
                        <div
                            className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${milestone.status === 'locked' ? 'opacity-50' : ''
                                }`}
                            onClick={() => toggleMilestone(mIndex)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                    ${milestone.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        milestone.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}
                                `}>
                                    {mIndex + 1}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{milestone.title}</h4>
                                    <p className="text-xs text-gray-500">{milestone.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase
                                    ${milestone.status === 'completed' ? 'bg-green-50 text-green-600' :
                                        milestone.status === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}
                                `}>
                                    {milestone.status}
                                </span>
                                {openMilestones[mIndex] ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                            </div>
                        </div>

                        {/* Milestone Details (Accordion Body) */}
                        {openMilestones[mIndex] && (
                            <div className="px-6 pb-6 pl-16 space-y-4 animate-fadeIn">
                                {/* 1. Quiz Performance (Sections) */}
                                <div className="space-y-2">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Quiz Performance</h5>
                                    {milestone.sections && milestone.sections.length > 0 ? (
                                        milestone.sections.map((section, sIndex) => {
                                            const quiz = section.quiz;
                                            const hasQuiz = quiz && quiz.questions && quiz.questions.length > 0;
                                            const score = quiz ? quiz.userScore : 0;
                                            const isLowScore = score < 75 && hasQuiz; // Warning threshold

                                            return (
                                                <div key={sIndex} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                    <span className="text-sm text-gray-700">{section.title}</span>

                                                    {hasQuiz ? (
                                                        <div className="flex items-center gap-3">
                                                            {isLowScore && (
                                                                <span className="flex items-center gap-1 text-xs text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                                                                    <FaExclamationTriangle size={10} /> Focus Area
                                                                </span>
                                                            )}
                                                            <span className={`text-sm font-bold ${score >= 75 ? 'text-green-600' :
                                                                    score > 0 ? 'text-yellow-600' : 'text-gray-400'
                                                                }`}>
                                                                {score}%
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No Quiz</span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No sections defined.</p>
                                    )}
                                </div>

                                {/* 2. Interview Performance (If Completed/Passed/Failed) */}
                                {(milestone.interviewStatus !== 'pending' && milestone.interviewStatus !== 'scheduled') && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/50 rounded-xl p-4">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            Mentor Interview
                                            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${milestone.interviewStatus === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {milestone.interviewStatus.toUpperCase()}
                                            </span>
                                        </h5>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-xs text-gray-500 block">Score</span>
                                                <span className="text-lg font-bold text-gray-800">{milestone.interviewScore || 0}%</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block">Feedback</span>
                                                <p className="text-sm text-gray-700 italic">
                                                    "{milestone.interviewFeedback || 'No feedback provided.'}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DetailedProgressTracker;
