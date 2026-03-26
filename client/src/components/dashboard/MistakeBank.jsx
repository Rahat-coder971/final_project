import React, { useState, useEffect } from 'react';
import { FaBug, FaTools, FaCheck } from 'react-icons/fa';
import * as api from '../../api';

const MistakeBank = ({ studentId }) => {
    const [mistakes, setMistakes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMistakes = async () => {
            try {
                const { data } = await api.fetchMistakeBank(studentId);
                setMistakes(data);
            } catch (error) {
                console.error("Failed to load mistakes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMistakes();
    }, [studentId]);

    if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded-2xl"></div>;

    if (mistakes.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-6 text-center shadow-sm">
                <FaCheck className="text-green-500 text-4xl mx-auto mb-3" />
                <h3 className="text-gray-800 font-bold">No High-Frequency Errors</h3>
                <p className="text-gray-500 text-sm">You're solving problems accurately! Keep it up.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-red-50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaBug className="text-red-500" /> Focus Areas (Mistake Bank)
            </h3>

            <div className="space-y-3">
                {mistakes.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-red-50/50 p-3 rounded-xl border border-red-100/50 hover:bg-red-50 transition-colors">
                        <div>
                            <p className="font-semibold text-gray-800">{m.topic}</p>
                            <p className="text-xs text-red-500">{m.count} incorrect answers recently</p>
                        </div>
                        <button className="px-3 py-1 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm">
                            Review
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button className="text-indigo-600 text-sm font-bold flex items-center justify-center gap-1 hover:underline">
                    <FaTools size={12} /> Practice Weakest Topics
                </button>
            </div>
        </div>
    );
};

export default MistakeBank;
