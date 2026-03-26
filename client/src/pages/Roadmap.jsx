import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { FaCheckCircle, FaLock, FaBookOpen, FaClipboardList, FaChevronDown, FaChevronUp, FaStar } from 'react-icons/fa';
import * as api from '../api';
import { toast } from 'react-toastify';

const Roadmap = () => {
    const [roadmap, setRoadmap] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState(null); // { milestoneIdx, sectionIdx, questions }

    // Create Modal State
    const [topic, setTopic] = useState('');
    const [goal, setGoal] = useState('');

    useEffect(() => {
        fetchUserRoadmap();
    }, []);

    const fetchUserRoadmap = async () => {
        try {
            const { data } = await api.fetchRoadmap();
            if (data) {
                setRoadmap(data);
                // Initialize UI state (open active milestones)
                const uiMilestones = data.milestones.map((m, idx) => ({
                    ...m,
                    isOpen: m.status === 'active' || m.status === 'completed', // Open active/completed by default
                    sections: m.sections.map(s => ({
                        ...s,
                        isOpen: false
                    }))
                }));
                setMilestones(uiMilestones);
            }
        } catch (error) {
            console.log("No existing roadmap or error fetching");
        }
    };

    const toggleMilestone = (idx) => {
        setMilestones(milestones.map((m, i) => i === idx ? { ...m, isOpen: !m.isOpen } : m));
    };

    const toggleSection = (mIdx, sIdx) => {
        setMilestones(milestones.map((m, i) => {
            if (i === mIdx) {
                return {
                    ...m,
                    sections: m.sections.map((s, j) => j === sIdx ? { ...s, isOpen: !s.isOpen } : s)
                };
            }
            return m;
        }));
    };

    const handleGenerate = async () => {
        if (!topic || !goal) return toast.error('Please fill in all fields');

        setIsGenerating(true);
        try {
            const { data } = await api.generateRoadmap({ topic, goal });
            setRoadmap(data);
            setMilestones(data.milestones.map(m => ({ ...m, isOpen: m.status === 'active' })));
            setShowCreateModal(false);
            toast.success('Roadmap generated!');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to generate roadmap');
        } finally {
            setIsGenerating(false);
        }
    };

    const openQuiz = (mIdx, sIdx) => {
        const section = milestones[mIdx].sections[sIdx];
        if (section.status === 'locked' || milestones[mIdx].status === 'locked') {
            return toast.info('This section is locked until you complete previous milestones.');
        }
        if (section.quiz.passed) return toast.info('You have already passed this quiz!');

        setActiveQuiz({
            milestoneIdx: mIdx,
            sectionIdx: sIdx,
            questions: section.quiz.questions,
            title: section.title
        });
        setShowQuizModal(true);
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {roadmap ? `Mastery Path: ${roadmap.title}` : 'My Learning Path'}
                    </h1>
                    {roadmap && (
                        <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-500">Goal: {roadmap.goal}</span>
                            {roadmap.mentor && (
                                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                    <FaCheckCircle /> Mentored by {roadmap.mentor.name}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        disabled={roadmap?.isGenerated} // Locked if already generated
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-colors ${roadmap?.isGenerated ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-blue-700 shadow-blue-500/30'}`}
                    >
                        {roadmap?.isGenerated ? <FaLock /> : '✨'} {roadmap ? 'Plan Locked' : 'Generate New Path'}
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {!roadmap && !isGenerating && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No active roadmap</h3>
                    <p className="text-gray-500 mb-6">Create a personalized AI-driven study plan to get started.</p>
                    <button onClick={() => setShowCreateModal(true)} className="text-primary font-bold hover:underline">
                        Create One Now
                    </button>
                </div>
            )}

            {/* Milestones List */}
            <div className="space-y-6 relative pb-20">
                {roadmap && <div className="absolute left-8 top-8 bottom-8 w-1 bg-gray-100 hidden md:block"></div>}

                {milestones.map((milestone, mIdx) => (
                    <div key={mIdx} className={`relative md:pl-24 transition-opacity ${milestone.status === 'locked' ? 'opacity-60' : 'opacity-100'}`}>
                        {/* Milestone Marker */}
                        <div className={`absolute left-4 top-6 w-10 h-10 rounded-full z-10 hidden md:flex items-center justify-center border-4 text-white font-bold transition-all
                            ${milestone.status === 'completed' ? 'bg-green-500 border-green-100' :
                                milestone.status === 'active' ? 'bg-blue-600 border-blue-100' : 'bg-gray-300 border-gray-100'}`}>
                            {milestone.status === 'locked' ? <FaLock size={14} /> : (mIdx + 1)}
                        </div>

                        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${milestone.status === 'active' ? 'border-blue-200 ring-4 ring-blue-50' : 'border-gray-100'}`}>
                            {/* Milestone Header */}
                            <div
                                className="p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleMilestone(mIdx)}
                            >
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        {milestone.title}
                                        {milestone.status === 'completed' && <FaCheckCircle className="text-green-500" />}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                                </div>
                                {milestone.isOpen ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                            </div>

                            {/* Interview Status Badge */}
                            {milestone.interviewStatus === 'scheduled' && (
                                <div className="px-6 pb-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                                <FaClipboardList />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-blue-900">Milestone Review Scheduled</p>
                                                <p className="text-xs text-blue-700">
                                                    {milestone.bookingId ?
                                                        `Time: ${new Date(milestone.bookingId.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` :
                                                        'Your mentor has scheduled a review session.'}
                                                </p>
                                            </div>
                                        </div>
                                        {milestone.bookingId && milestone.bookingId.meetingLink && (
                                            <a
                                                href={`/meeting/${milestone.bookingId.meetingLink.split('/').pop()}`}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                                            >
                                                Join Meeting
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Sections (Expanded) */}
                            {milestone.isOpen && (
                                <div className="border-t border-gray-100 bg-gray-50/30">
                                    {milestone.sections.map((section, sIdx) => (
                                        <div key={sIdx} className="border-b border-gray-100 last:border-0">
                                            <div className="p-4 pl-8 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                                                        ${section.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                            section.status === 'active' ? 'bg-white border-2 border-blue-500 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        {section.status === 'completed' ? <FaCheckCircle /> :
                                                            section.status === 'locked' ? <FaLock size={12} /> : (sIdx + 1)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className={`font-semibold ${section.status === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>
                                                            {section.title}
                                                        </h4>
                                                        {/* Inline Chapters preview */}
                                                        <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                                            {section.chapters.length} Chapters • Quiz {section.quiz.passed ? 'Passed' : 'Pending'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleSection(mIdx, sIdx)}
                                                        className="text-gray-500 hover:text-blue-600 p-2"
                                                    >
                                                        {section.isOpen ? 'Hide Resources' : 'View Resources'}
                                                    </button>
                                                    {section.status !== 'locked' && !section.quiz.passed && (
                                                        <button
                                                            onClick={() => openQuiz(mIdx, sIdx)}
                                                            className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-amber-200 flex items-center gap-1"
                                                        >
                                                            <FaStar /> Take Quiz
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Chapters & Resources */}
                                            {section.isOpen && (
                                                <div className="bg-white p-4 pl-20 space-y-3">
                                                    {section.chapters.map((chapter, cIdx) => (
                                                        <div key={cIdx} className="flex items-start gap-3">
                                                            <FaBookOpen className="text-gray-300 mt-1" />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-800">{chapter.title}</p>
                                                                {chapter.resources && chapter.resources.map((res, rIdx) => (
                                                                    <a key={rIdx} href={res.url} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 hover:underline mt-0.5">
                                                                        {res.title || 'View Resource'} →
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Generation Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Mastery Path</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Advanced React Patterns"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
                                <input
                                    type="text"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="e.g. Become a Senior Developer"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">Cancel</button>
                            <button onClick={handleGenerate} disabled={isGenerating} className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-700">
                                {isGenerating ? 'Generating...' : 'Start Journey'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Modal */}
            {showQuizModal && activeQuiz && (
                <QuizModal
                    quiz={activeQuiz}
                    onClose={() => setShowQuizModal(false)}
                    roadmapId={roadmap._id}
                    onPass={() => {
                        setShowQuizModal(false);
                        fetchUserRoadmap(); // Refresh to unlock next section
                        toast.success('Quiz Passed! Next section unlocked.');
                    }}
                />
            )}
        </DashboardLayout>
    );
};

const QuizModal = ({ quiz, onClose, roadmapId, onPass }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState(new Array(quiz.questions.length).fill(null));
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [passed, setPassed] = useState(false);

    const handleOptionSelect = (idx) => {
        if (submitted) return;
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = idx;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (answers.includes(null)) return toast.warning('Please answer all questions');

        try {
            const { data } = await api.submitQuiz(roadmapId, quiz.milestoneIdx, quiz.sectionIdx, answers);
            setScore(data.score);
            setPassed(data.passed);
            setSubmitted(true);
            if (data.passed) {
                setTimeout(onPass, 2000);
            }
        } catch (error) {
            toast.error('Failed to submit quiz');
        }
    };

    const question = quiz.questions[currentQuestion];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 animate-fade-in-up">
                {!submitted ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Quiz: {quiz.title}</h3>
                            <span className="text-sm text-gray-500">Q{currentQuestion + 1}/{quiz.questions.length}</span>
                        </div>

                        <div className="mb-8">
                            <p className="text-lg font-medium text-gray-800 mb-4">{question.question}</p>
                            <div className="space-y-3">
                                {question.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(idx)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all
                                            ${answers[currentQuestion] === idx
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                                disabled={currentQuestion === 0}
                                className="text-gray-500 disabled:opacity-30"
                            >
                                Previous
                            </button>

                            {currentQuestion < quiz.questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                                    className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-black"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-500/30"
                                >
                                    Submit Quiz
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl
                            ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {passed ? '🎉' : '❌'}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {passed ? 'Assessment Passed!' : 'Needs Improvement'}
                        </h3>
                        <p className="text-gray-500 mb-8">
                            You scored <span className="font-bold text-gray-900">{score.toFixed(0)}%</span>.
                            {passed ? ' You have unlocked the next section.' : ' Review the materials and try again.'}
                        </p>

                        {passed ? (
                            <button onClick={onPass} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700">
                                Continue Journey
                            </button>
                        ) : (
                            <button onClick={onClose} className="bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-bold hover:bg-gray-300">
                                Close
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Roadmap;
