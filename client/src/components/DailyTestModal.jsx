import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { FaFire } from 'react-icons/fa';
// import { toast } from 'react-hot-toast'; // Assuming toast is available or use console

const DailyTestModal = ({ isOpen, onClose, onComplete, recoveryDay, preloadedQuestions }) => {
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionIdx: optionIdx }
    const [result, setResult] = useState(null);

    // Fetch Questions
    useEffect(() => {
        if (isOpen) {
            if (preloadedQuestions && preloadedQuestions.length > 0) {
                setQuestions(preloadedQuestions);
            } else if (!questions.length) {
                fetchQuestions();
            }
        }
    }, [isOpen, preloadedQuestions]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await api.generateDailyTest();

            if (res.data.completed) {
                // Already completed today
                setResult({ alreadyCompleted: true, score: res.data.score || 0 });
            } else {
                setQuestions(res.data.questions);
            }
        } catch (error) {
            console.error("Failed to generate test", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (optionIdx) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIdx }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            submitTest();
        }
    };

    const submitTest = async () => {
        setLoading(true);

        // Convert answers object to array of indices
        const answersArray = questions.map((_, i) => answers[i]);

        try {
            let res;
            if (recoveryDay) {
                // Submit to Recovery Endpoint
                res = await api.submitRecoveryDay({
                    day: recoveryDay,
                    answers: answersArray
                });
            } else {
                // Standard Daily Quiz Submit
                res = await api.submitDailyTest({
                    answers: answersArray
                });
            }

            // res.data = { score, total, results }
            setResult(res.data);

            if (onComplete) onComplete(res.data);
        } catch (error) {
            console.error("Failed to submit test", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative animate-fadeIn">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

                {loading ? (
                    <div className="text-center py-10">
                        <div className="loader mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full w-10 h-10 animate-spin"></div>
                        <p className="text-gray-600 font-medium">Loading your challenge...</p>
                    </div>
                ) : result ? (
                    <div className="text-center py-6">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-2">
                            {result.alreadyCompleted ? "Already Completed!" : "Quiz Complete!"}
                        </h2>

                        {!result.alreadyCompleted && (
                            <div className="text-6xl font-black text-gray-800 mb-4">
                                {Math.round((result.score / result.total) * 100)}%
                            </div>
                        )}

                        <div className="flex justify-center items-center gap-2 mb-6 bg-orange-100 text-orange-600 px-4 py-2 rounded-full mx-auto w-fit">
                            <FaFire className="animate-pulse" />
                            <span className="font-bold">Daily Streak Active!</span>
                        </div>

                        <p className="text-gray-500 mb-6">See you tomorrow to keep the flame alive.</p>
                        <button onClick={onClose} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
                            Back to Dashboard
                        </button>
                    </div>
                ) : questions.length > 0 ? (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Daily Check-in</h3>
                            <span className="text-sm font-medium text-gray-500">Q{currentIndex + 1}/{questions.length}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 h-2 rounded-full mb-6">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>

                        <div className="mb-8">
                            <p className="text-lg text-gray-800 font-medium mb-4">{questions[currentIndex].question}</p>
                            <div className="space-y-3">
                                {questions[currentIndex].options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(idx)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${answers[currentIndex] === idx
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                                Topic: {questions[currentIndex].topic || 'General'}
                            </span>
                            <button
                                onClick={handleNext}
                                disabled={answers[currentIndex] === undefined}
                                className={`px-6 py-2 rounded-lg font-bold transition-colors ${answers[currentIndex] !== undefined
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
                            </button>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button onClick={submitTest} className="text-xs text-gray-400 hover:text-gray-600 underline">
                                Skip & Submit
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">Failed to load questions.</div>
                )}
            </div>
        </div>
    );
};

export default DailyTestModal;
