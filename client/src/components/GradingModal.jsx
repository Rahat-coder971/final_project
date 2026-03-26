import React, { useState } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import * as api from '../api';

const GradingModal = ({ isOpen, onClose, booking, onGradeSuccess }) => {
    const [score, setScore] = useState(75);
    const [feedback, setFeedback] = useState('');
    const [weakConcepts, setWeakConcepts] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !booking) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Parse weak concepts (comma separated)
            const conceptsArray = weakConcepts.split(',').map(c => c.trim()).filter(c => c);

            await api.completeInterview(booking._id, {
                score: Number(score),
                feedback,
                weakConcepts: conceptsArray,
                passed: Number(score) >= 75
            });

            if (onGradeSuccess) onGradeSuccess();
            onClose();
        } catch (error) {
            console.error("Grading failed:", error);
            alert("Failed to submit grade. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FaTimes />
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-1">Grade Interview</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Student: <span className="font-semibold text-gray-700">{booking.student?.name}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Score Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Score (0-100)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                className="w-16 p-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <p className={`text-xs mt-1 ${score >= 75 ? 'text-green-600 font-bold' : 'text-red-500'}`}>
                            {score >= 75 ? 'PASSING SCORE' : 'BELOW PASSING THRESHOLD (75)'}
                        </p>
                    </div>

                    {/* Feedback Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Feedback & Notes
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                            placeholder="Detailed feedback for the student..."
                            required
                        />
                    </div>

                    {/* Weak Concepts Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weak Concepts (Comma separated)
                        </label>
                        <input
                            type="text"
                            value={weakConcepts}
                            onChange={(e) => setWeakConcepts(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. React Hooks, Async/Await, State Management"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            These will update the student's personalized study plan.
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-md ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform active:scale-95'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Submitting...
                                </span>
                            ) : (
                                "Submit Grade"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GradingModal;
