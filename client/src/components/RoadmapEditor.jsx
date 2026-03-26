import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaCheckCircle, FaLock, FaUnlock, FaChevronDown, FaChevronUp, FaCalendarPlus, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as api from '../api';

const RoadmapEditor = ({ studentId, onBack }) => {
    const navigate = useNavigate();
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedMilestones, setExpandedMilestones] = useState({});

    // Booking Modal State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedMilestoneIdx, setSelectedMilestoneIdx] = useState(null);
    const [bookingDate, setBookingDate] = useState('');

    // Grading Modal State
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [gradingData, setGradingData] = useState({ score: '', feedback: '', mentorNotes: '', passed: true });
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleSaveRoadmap = async () => {
        try {
            await api.updateRoadmap(roadmap._id, roadmap);
            toast.success("Roadmap updated successfully");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save roadmap");
        }
    };

    useEffect(() => {
        if (studentId) {
            fetchRoadmap();
        }
    }, [studentId]);

    const fetchRoadmap = async () => {
        setLoading(true);
        try {
            const { data } = await api.fetchStudentRoadmap(studentId);
            setRoadmap(data);
            // Default expand active milestone or first one
            if (data.milestones) {
                const activeIdx = data.milestones.findIndex(m => m.status === 'active');
                if (activeIdx !== -1) {
                    setExpandedMilestones({ [activeIdx]: true });
                } else {
                    setExpandedMilestones({ 0: true });
                }
            }
        } catch (error) {
            console.error("Failed to fetch roadmap", error);
            toast.error("Failed to load student roadmap");
        } finally {
            setLoading(false);
        }
    };

    const toggleMilestone = (idx) => {
        setExpandedMilestones(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleUnlockSection = async (milestoneIdx, sectionIdx) => {
        // Optimistic update
        const newRoadmap = { ...roadmap };
        newRoadmap.milestones[milestoneIdx].sections[sectionIdx].status = 'active';
        // Also ensure milestone is active
        newRoadmap.milestones[milestoneIdx].status = 'active';

        setRoadmap(newRoadmap);

        try {
            await api.updateRoadmap(roadmap._id, newRoadmap);
            toast.success("Section unlocked for student");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update roadmap");
            fetchRoadmap(); // Revert
        }
    };

    const handleCompleteSection = async (milestoneIdx, sectionIdx) => {
        const newRoadmap = { ...roadmap };
        newRoadmap.milestones[milestoneIdx].sections[sectionIdx].status = 'completed';

        // Check if next section exists, unlock it
        if (sectionIdx + 1 < newRoadmap.milestones[milestoneIdx].sections.length) {
            newRoadmap.milestones[milestoneIdx].sections[sectionIdx + 1].status = 'active';
        }

        setRoadmap(newRoadmap);

        try {
            await api.updateRoadmap(roadmap._id, newRoadmap);
            toast.success("Section marked as complete");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update roadmap");
            fetchRoadmap();
        }
    };

    const openBookingModal = (idx) => {
        setSelectedMilestoneIdx(idx);
        setShowBookingModal(true);
    };

    const handleScheduleInterview = async () => {
        if (!bookingDate) {
            toast.error("Please select a date and time");
            return;
        }

        try {
            await api.createBooking({
                studentId: studentId, // Sent as body for mentor booking
                date: bookingDate,
                roadmapId: roadmap._id,
                milestoneIndex: selectedMilestoneIdx
            });

            toast.success("Interview Scheduled Successfully!");
            setShowBookingModal(false);
            setBookingDate('');
            fetchRoadmap(); // Refresh to see status update
        } catch (error) {
            console.error(error);
            toast.error("Failed to schedule interview");
        }
    };

    // Direct Grading (Grade Now)
    const handleDirectGrading = async (milestoneIdx) => {
        try {
            // 1. Create a "silent" booking for right now
            const { data: booking } = await api.createBooking({
                studentId: studentId,
                date: new Date().toISOString(),
                roadmapId: roadmap._id,
                milestoneIndex: milestoneIdx
            });

            // 2. Open Grading Modal for this new booking
            openGradingModal(booking._id);
        } catch (error) {
            console.error("Direct grading failed", error);
            toast.error("Failed to start grading session");
        }
    };

    const openGradingModal = (bookingId, initialData = null) => {
        setSelectedBookingId(bookingId);
        if (initialData) {
            setGradingData({
                score: initialData.score || '',
                feedback: initialData.feedback || '',
                mentorNotes: '',
                passed: initialData.passed !== undefined ? initialData.passed : true,
                sentiment: initialData.sentiment || 'Neutral',
                focusArea: initialData.focusArea || ''
            });
        } else {
            setGradingData({ score: '', feedback: '', mentorNotes: '', passed: true, sentiment: 'Neutral', focusArea: '' });
        }
        setShowGradingModal(true);
    };

    const submitGrading = async () => {
        if (!gradingData.score || !gradingData.feedback || !gradingData.focusArea) {
            toast.error("Please provide Score, Feedback, and Focus Area.");
            return;
        }

        try {
            await api.completeInterview(selectedBookingId, {
                score: parseInt(gradingData.score),
                feedback: gradingData.feedback,
                mentorNotes: gradingData.mentorNotes,
                passed: gradingData.passed,
                sentiment: gradingData.sentiment,
                focusArea: gradingData.focusArea
            });

            toast.success("Interview completed & graded!");
            setShowGradingModal(false);
            fetchRoadmap(); // Refresh to see unlocked milestone
        } catch (error) {
            console.error("Grading failed", error);
            toast.error("Failed to submit grading.");
        }
    };

    if (!studentId) return <div className="p-10 text-center">Please select a student.</div>;
    if (loading) return <div className="p-10 text-center">Loading roadmap...</div>;
    if (!roadmap) return <div className="p-10 text-center">Student has no roadmap yet.</div>;

    // Check if Legacy Roadmap (Weeks)
    if (roadmap.weeks && roadmap.weeks.length > 0 && (!roadmap.milestones || roadmap.milestones.length === 0)) {
        return (
            <div className="p-10 text-center">
                <h3 className="text-xl font-bold text-gray-700">Legacy Roadmap Detected</h3>
                <p className="text-gray-500">This student is on an old roadmap version. Please ask them to generate a new Mastery Path.</p>
                <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col relative">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-800 transition-colors">
                        <FaArrowLeft />
                    </button>
                    <div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={roadmap.title}
                                onChange={(e) => setRoadmap({ ...roadmap, title: e.target.value })}
                                className="text-xl font-bold text-gray-900 border border-gray-300 rounded px-2"
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-gray-900">{roadmap.title}</h2>
                        )}
                        <p className="text-sm text-gray-500">Goal: {roadmap.goal}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => { setIsEditing(false); fetchRoadmap(); }} // Cancel
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveRoadmap}
                                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2 shadow-sm"
                            >
                                <FaSave /> Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                        >
                            <FaEdit /> Customize Roadmap
                        </button>
                    )}
                </div>
            </div>

            {/* Content - Mastery Path View */}
            <div className="p-8 overflow-y-auto bg-gray-50/30 flex-1">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {roadmap.milestones?.map((milestone, mIdx) => (
                        <div key={mIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Milestone Header */}
                            <div
                                className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleMilestone(mIdx)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                        ${milestone.status === 'completed' ? 'bg-green-100 text-green-600' :
                                            milestone.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {mIdx + 1}
                                    </div>
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={milestone.title}
                                                    onChange={(e) => {
                                                        const newRoadmap = { ...roadmap };
                                                        newRoadmap.milestones = [...roadmap.milestones];
                                                        newRoadmap.milestones[mIdx] = { ...newRoadmap.milestones[mIdx], title: e.target.value };
                                                        setRoadmap(newRoadmap);
                                                    }}
                                                    placeholder="Milestone Title"
                                                    className="w-full font-bold text-gray-900 border border-gray-300 rounded px-2 py-1"
                                                />
                                                <textarea
                                                    value={milestone.description}
                                                    onChange={(e) => {
                                                        const newRoadmap = { ...roadmap };
                                                        newRoadmap.milestones = [...roadmap.milestones];
                                                        newRoadmap.milestones[mIdx] = { ...newRoadmap.milestones[mIdx], description: e.target.value };
                                                        setRoadmap(newRoadmap);
                                                    }}
                                                    placeholder="Description"
                                                    className="w-full text-xs text-gray-500 border border-gray-300 rounded px-2 py-1 h-16"
                                                />
                                                {/* Resources Input */}
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="text"
                                                        placeholder="Resource Title (e.g., React Docs)"
                                                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = e.target.value;
                                                                if (val) {
                                                                    const newRoadmap = { ...roadmap };
                                                                    newRoadmap.milestones = [...roadmap.milestones];
                                                                    newRoadmap.milestones[mIdx] = { ...newRoadmap.milestones[mIdx] };
                                                                    if (!newRoadmap.milestones[mIdx].resources) {
                                                                        newRoadmap.milestones[mIdx].resources = [];
                                                                    } else {
                                                                        newRoadmap.milestones[mIdx].resources = [...newRoadmap.milestones[mIdx].resources];
                                                                    }
                                                                    newRoadmap.milestones[mIdx].resources.push({ title: val, url: '' });
                                                                    setRoadmap(newRoadmap);
                                                                    e.target.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newRoadmap = { ...roadmap };
                                                            newRoadmap.milestones = [...roadmap.milestones];
                                                            newRoadmap.milestones[mIdx] = { ...newRoadmap.milestones[mIdx] };

                                                            if (!newRoadmap.milestones[mIdx].sections) {
                                                                newRoadmap.milestones[mIdx].sections = [];
                                                            } else {
                                                                newRoadmap.milestones[mIdx].sections = [...newRoadmap.milestones[mIdx].sections];
                                                            }

                                                            newRoadmap.milestones[mIdx].sections.push({
                                                                title: "New Section",
                                                                status: "locked",
                                                                resources: [] // Init empty
                                                            });
                                                            setRoadmap(newRoadmap);
                                                            // Ensure expanded to show new section
                                                            setExpandedMilestones(prev => ({
                                                                ...prev,
                                                                [mIdx]: true
                                                            }));
                                                        }}
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap px-2 py-1 border border-blue-200 rounded bg-blue-50"
                                                    >
                                                        + Add Section
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className={`font-bold ${milestone.status === 'locked' ? 'text-gray-400' : 'text-gray-900'}`}>{milestone.title}</h3>
                                                <p className="text-xs text-gray-500">{milestone.description}</p>
                                                {milestone.resources && milestone.resources.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {milestone.resources.map((res, rIdx) => (
                                                            <a key={rIdx} href={res.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">
                                                                {res.title}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                {!isEditing && (
                                    <div className="flex items-center gap-3">
                                        {/* Link Interview Button */}
                                        {milestone.status !== 'locked' && (milestone.interviewStatus === 'pending' || milestone.interviewStatus === 'retake') && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openBookingModal(mIdx); }}
                                                    className={`px-3 py-1 text-xs rounded-full flex items-center gap-1 border 
                                                        ${milestone.interviewStatus === 'retake'
                                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
                                                            : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200'}`}
                                                >
                                                    <FaCalendarPlus /> {milestone.interviewStatus === 'retake' ? 'Schedule Retake' : 'Schedule Review'}
                                                </button>

                                                {/* Grade Now Button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDirectGrading(mIdx); }}
                                                    className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100 flex items-center gap-1 border border-green-200"
                                                >
                                                    <FaCheckCircle /> Grade Now
                                                </button>

                                                {milestone.interviewStatus === 'retake' && milestone.bookingId && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openGradingModal(milestone.bookingId._id, {
                                                                score: milestone.interviewScore,
                                                                feedback: milestone.interviewFeedback,
                                                                passed: false // It was retake, so it failed
                                                            });
                                                        }}
                                                        className="px-3 py-1 text-xs bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 flex items-center gap-1 border border-gray-200"
                                                    >
                                                        <FaEdit /> Edit Score
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {milestone.interviewStatus === 'scheduled' && (
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                                                    Meeting Scheduled
                                                </span>
                                                {milestone.bookingId && milestone.bookingId.meetingLink && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const roomName = milestone.bookingId.meetingLink.split('/').pop();
                                                                navigate(`/meeting/${roomName}`);
                                                            }}
                                                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm border border-blue-600"
                                                        >
                                                            Join
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openGradingModal(milestone.bookingId._id);
                                                            }}
                                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm border border-green-600 ml-2"
                                                        >
                                                            Complete & Grade
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        {expandedMilestones[mIdx] ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                                    </div>
                                )}
                            </div>

                            {/* Sections */}
                            {
                                expandedMilestones[mIdx] && (
                                    <div className="border-t border-gray-100">
                                        {(milestone.sections || []).map((section, sIdx) => (
                                            <div key={sIdx} className="p-4 border-b border-gray-50 last:border-0 flex justify-between items-center pl-16 hover:bg-gray-50/50">
                                                <div className="flex-1">
                                                    {isEditing ? (
                                                        <div className="space-y-1">
                                                            <input
                                                                type="text"
                                                                value={section.title}
                                                                onChange={(e) => {
                                                                    const newRoadmap = { ...roadmap };
                                                                    newRoadmap.milestones = [...roadmap.milestones];
                                                                    newRoadmap.milestones[mIdx] = { ...newRoadmap.milestones[mIdx] };
                                                                    newRoadmap.milestones[mIdx].sections = [...newRoadmap.milestones[mIdx].sections];
                                                                    newRoadmap.milestones[mIdx].sections[sIdx] = {
                                                                        ...newRoadmap.milestones[mIdx].sections[sIdx],
                                                                        title: e.target.value
                                                                    };
                                                                    setRoadmap(newRoadmap);
                                                                }}
                                                                className="w-full font-medium text-gray-800 border border-gray-300 rounded px-2 py-1"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Resource Link (URL)"
                                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        // Simple add resource logic can be expanded
                                                                        const val = e.target.value;
                                                                        if (val) {
                                                                            const newRoadmap = { ...roadmap };
                                                                            newRoadmap.milestones = [...roadmap.milestones];
                                                                            newRoadmap.milestones[mIdx] = { ...newRoadmap.milestones[mIdx] };
                                                                            newRoadmap.milestones[mIdx].sections = [...newRoadmap.milestones[mIdx].sections];
                                                                            const section = { ...newRoadmap.milestones[mIdx].sections[sIdx] };

                                                                            if (!section.resources) {
                                                                                section.resources = [];
                                                                            } else {
                                                                                section.resources = [...section.resources];
                                                                            }
                                                                            section.resources.push({ title: 'Resource', url: val });
                                                                            newRoadmap.milestones[mIdx].sections[sIdx] = section;

                                                                            setRoadmap(newRoadmap);
                                                                            e.target.value = '';
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <h4 className={`font-medium ${section.status === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>
                                                                {section.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 capitalize">Status: {section.status}</p>
                                                            {section.resources && section.resources.length > 0 && (
                                                                <div className="flex gap-2 mt-1">
                                                                    {section.resources.map((res, rIdx) => (
                                                                        <a key={rIdx} href={res.url} target="_blank" className="text-xs text-blue-500 hover:underline">Link</a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {!isEditing && (
                                                    <div className="flex gap-2">
                                                        {section.status === 'locked' && (
                                                            <button
                                                                onClick={() => handleUnlockSection(mIdx, sIdx)}
                                                                className="px-3 py-1 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100 flex items-center gap-1"
                                                            >
                                                                <FaUnlock /> Unlock
                                                            </button>
                                                        )}
                                                        {section.status === 'active' && (
                                                            <button
                                                                onClick={() => handleCompleteSection(mIdx, sIdx)}
                                                                className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 flex items-center gap-1"
                                                            >
                                                                <FaCheckCircle /> Mark Complete
                                                            </button>
                                                        )}
                                                        {section.status === 'completed' && (
                                                            <span className="text-green-500 text-xl"><FaCheckCircle /></span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {isEditing && (
                                            <div className="p-4 pl-16">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newRoadmap = { ...roadmap };
                                                        newRoadmap.milestones = [...roadmap.milestones];
                                                        newRoadmap.milestones[mIdx] = { ...newRoadmap.milestones[mIdx] };

                                                        if (!newRoadmap.milestones[mIdx].sections) {
                                                            newRoadmap.milestones[mIdx].sections = [];
                                                        } else {
                                                            newRoadmap.milestones[mIdx].sections = [...newRoadmap.milestones[mIdx].sections];
                                                        }

                                                        newRoadmap.milestones[mIdx].sections.push({
                                                            title: "New Section",
                                                            status: "locked",
                                                            resources: [] // Init empty
                                                        });
                                                        setRoadmap(newRoadmap);
                                                    }}
                                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    + Add Section
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        </div>
                    ))}
                    {isEditing && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    const newRoadmap = { ...roadmap };
                                    if (!newRoadmap.milestones) {
                                        newRoadmap.milestones = [];
                                    } else {
                                        newRoadmap.milestones = [...newRoadmap.milestones];
                                    }
                                    newRoadmap.milestones.push({
                                        title: `Milestone ${newRoadmap.milestones.length + 1}`,
                                        description: "New Milestone Description",
                                        status: "locked",
                                        sections: []
                                    });
                                    setRoadmap(newRoadmap);
                                    // Auto-expand the new milestone
                                    setExpandedMilestones(prev => ({
                                        ...prev,
                                        [newRoadmap.milestones.length - 1]: true
                                    }));
                                }}
                                className="px-6 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-600 font-medium transition-colors w-full"
                            >
                                + Add Milestone
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            {
                showBookingModal && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                            <h3 className="text-lg font-bold mb-4">Schedule Milestone Review</h3>
                            {/* ... existing modal inputs ... */}
                            <p className="text-sm text-gray-500 mb-4">
                                Select a time to review this milestone with the student.
                            </p>
                            <input
                                type="datetime-local"
                                className="w-full border border-gray-300 rounded p-2 mb-4"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowBookingModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleScheduleInterview}
                                    className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700"
                                >
                                    Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Grading Modal */}
            {
                showGradingModal && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-bold mb-4">Complete Milestone Review</h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={gradingData.score}
                                    onChange={(e) => setGradingData({ ...gradingData, score: e.target.value })}
                                />
                            </div>

                            {/* Dynamic Result Display */}
                            <div className={`mb-4 p-3 rounded text-center font-bold border 
                                ${parseInt(gradingData.score) >= 75
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'}`}>
                                Result: {parseInt(gradingData.score) >= 75 ? 'PASSED (Unlocks Next)' : 'NOT PASSED'}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback Sentiment</label>
                                <select
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={gradingData.sentiment}
                                    onChange={(e) => setGradingData({ ...gradingData, sentiment: e.target.value })}
                                >
                                    <option value="Positive">Positive</option>
                                    <option value="Neutral">Neutral</option>
                                    <option value="Constructive">Constructive</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Key Focus Area</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Code Quality, System Design..."
                                    className="w-full border border-gray-300 rounded p-2"
                                    value={gradingData.focusArea}
                                    onChange={(e) => setGradingData({ ...gradingData, focusArea: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded p-2 h-24"
                                    placeholder="Constructive feedback for the student..."
                                    value={gradingData.feedback}
                                    onChange={(e) => setGradingData({ ...gradingData, feedback: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Private Notes</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded p-2 h-20"
                                    placeholder="Notes for yourself..."
                                    value={gradingData.mentorNotes}
                                    onChange={(e) => setGradingData({ ...gradingData, mentorNotes: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowGradingModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitGrading}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Complete & Grade
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RoadmapEditor;
