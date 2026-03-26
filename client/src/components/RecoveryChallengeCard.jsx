import React, { useState, useEffect } from 'react';
import { FaLock, FaCheckCircle, FaPlay, FaExclamationTriangle } from 'react-icons/fa';
import * as api from '../api';

const RecoveryChallengeCard = ({ studentId, onStartQuiz }) => {
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChallenge = async () => {
            try {
                const { data } = await api.fetchRecoveryChallenge();
                if (data.active) {
                    setChallenge(data);
                } else {
                    setChallenge(null);
                }
            } catch (error) {
                console.error("Failed to load recovery challenge", error);
            } finally {
                setLoading(false);
            }
        };
        loadChallenge();
    }, [studentId]);

    if (loading) return null;
    if (!challenge) return null; // Don't verify if no active challenge

    const currentDay = challenge.schedule.find(d => d.status === 'unlocked' || d.status === 'completed'); // Show progress
    // Actually we want the first 'unlocked' one as "Current", or the last completed if all done?
    // Let's iterate.

    return (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 mb-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <FaExclamationTriangle size={100} className="text-orange-500" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                Intervention Mode
                            </span>
                            <span className="text-orange-600 text-sm font-medium">Day {challenge.schedule.filter(d => d.status === 'completed').length} of 7 Completed</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">{challenge.title}</h2>
                        <p className="text-gray-600 mt-1 max-w-2xl">
                            Your mentor identified this as a critical weak area. Complete this 7-day recovery plan to unlock your next milestone.
                        </p>
                    </div>
                </div>

                {/* Timeline Stepper */}
                <div className="flex items-center justify-between relative mt-8 mb-8">
                    {/* Line */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>

                    {challenge.schedule.map((day, idx) => {
                        let statusColor = "bg-gray-200 text-gray-400"; // Locked
                        let icon = <FaLock size={12} />;
                        let ring = "";

                        if (day.status === 'completed') {
                            statusColor = "bg-green-500 text-white";
                            icon = <FaCheckCircle size={14} />;
                        } else if (day.status === 'unlocked') {
                            statusColor = "bg-orange-500 text-white";
                            icon = <FaPlay size={12} className="ml-0.5" />;
                            ring = "ring-4 ring-orange-100";
                        }

                        return (
                            <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColor} ${ring} transition-all duration-300 shadow-md`}>
                                    {icon}
                                </div>
                                <div className="absolute top-10 w-32 text-center transition-opacity duration-200">
                                    <p className={`text-xs font-bold ${day.status === 'unlocked' ? 'text-orange-600' : 'text-gray-500'}`}>Day {day.day}</p>
                                    <p className="text-[10px] text-gray-400 truncate px-1">{day.topic}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Active Day Action */}
                {challenge.schedule.map(day => {
                    if (day.status === 'unlocked') {
                        return (
                            <div key={day.day} className="bg-white rounded-xl p-4 border border-orange-100 flex justify-between items-center shadow-sm">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">Day {day.day}: {day.topic}</h4>
                                    <p className="text-sm text-gray-500">Focus: {day.subtopics?.join(', ') || 'General Practice'}</p>
                                </div>
                                <button
                                    onClick={() => onStartQuiz(day.day)}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    Start Practice
                                </button>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

export default RecoveryChallengeCard;
