import React, { useState, useEffect } from 'react';
import { FaFire, FaCheckCircle, FaPlay, FaTrophy } from 'react-icons/fa';
import * as api from '../../api';

const DailyQuizLauncher = ({ studentId, onStart, onRefresh }) => {
    const [todayStatus, setTodayStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkTodayStatus();
    }, [studentId]);

    const checkTodayStatus = async () => {
        try {
            setLoading(true);
            const res = await api.generateDailyTest(studentId);
            if (res.data.completed) {
                setTodayStatus({
                    completed: true,
                    score: res.data.result.score,
                    streak: res.data.result.streak
                });
            } else {
                setTodayStatus({ completed: false });
            }
        } catch (error) {
            console.error('Failed to check today status', error);
            setTodayStatus({ completed: false });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Checking today's status...</p>
            </div>
        );
    }

    if (todayStatus?.completed) {
        return (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl shadow-sm border border-green-200">
                <div className="text-center">
                    <FaCheckCircle className="text-green-500 text-5xl mb-4 mx-auto" />
                    <h3 className="text-2xl font-black text-gray-900 mb-2">✅ Completed Today!</h3>
                    <p className="text-gray-600 mb-4">Great job maintaining your streak!</p>

                    <div className="flex justify-center gap-6 mb-4">
                        <div className="bg-white px-6 py-3 rounded-xl shadow-sm">
                            <div className="text-2xl font-bold text-indigo-600">{todayStatus.score}%</div>
                            <div className="text-xs text-gray-500">Your Score</div>
                        </div>
                        <div className="bg-white px-6 py-3 rounded-xl shadow-sm">
                            <div className="text-2xl font-bold text-orange-500 flex items-center gap-1 justify-center">
                                <FaFire /> {todayStatus.streak?.current || 0}
                            </div>
                            <div className="text-xs text-gray-500">Current Streak</div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500">Come back tomorrow for your next challenge!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl shadow-sm border border-indigo-200">
            <div className="text-center">
                <FaTrophy className="text-indigo-500 text-5xl mb-4 mx-auto" />
                <h3 className="text-2xl font-black text-gray-900 mb-2">Today's Challenge Awaits!</h3>
                <p className="text-gray-600 mb-6">
                    Test your knowledge and maintain your learning streak
                </p>

                <button
                    onClick={onStart}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-black text-lg 
                               hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl 
                               transform hover:-translate-y-1 flex items-center gap-3 mx-auto">
                    <FaPlay /> Start Daily Challenge
                </button>

                <p className="text-xs text-gray-500 mt-4">
                    💡 Tip: Complete daily challenges to build your streak and master weak concepts!
                </p>
            </div>
        </div>
    );
};

export default DailyQuizLauncher;
