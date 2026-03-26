import React, { useState, useEffect } from 'react';
import { FaRobot, FaMagic } from 'react-icons/fa';
import * as api from '../api';

const AISummary = ({ studentId }) => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await api.generatePerformanceSummary(studentId);
                setSummary(data.summary);
            } catch (error) {
                console.error("AI Summary Error:", error);
                setSummary("AI Analysis unavailable at the moment.");
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchSummary();
        }
    }, [studentId]);

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <FaRobot size={120} />
            </div>

            <div className="flex items-start gap-4 relative z-10">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <FaMagic className="text-yellow-300 text-xl" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-200 mb-1">AI Performance Analysis</h3>
                    {loading ? (
                        <div className="animate-pulse h-16 w-full bg-white/10 rounded-lg"></div>
                    ) : (
                        <p className="text-lg font-medium leading-relaxed font-serif italic">
                            "{summary}"
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AISummary;
