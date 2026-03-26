import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { fetchStudentProfile } from '../api';
import { FaDownload, FaRobot, FaCalendarAlt, FaFileAlt } from 'react-icons/fa';
import ErrorBoundary from '../components/ErrorBoundary';

const MeetingNotes = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState(null);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const { data: profile } = await fetchStudentProfile();
                const studentId = profile.user?._id || profile._id;

                const response = await fetch(`http://localhost:5001/api/ai/notes/${studentId}`, {
                    headers: {
                        Authorization: `Bearer ${JSON.parse(localStorage.getItem('profile'))?.token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setNotes(data);
                    if (data.length > 0) {
                        setSelectedNote(data[0]);
                    }
                } else {
                    console.error("Failed to fetch notes");
                }
            } catch (err) {
                console.error("Error fetching notes:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, []);

    const downloadNotes = (note) => {
        const element = document.createElement("a");
        const file = new Blob([note.content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `meeting_notes_${new Date(note.createdAt).toISOString().split('T')[0]}.txt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <ErrorBoundary>
            <DashboardLayout>
                <div className="flex flex-col h-[calc(100vh-8rem)]">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FaRobot className="text-purple-600" /> AI Meeting Notes
                        </h1>
                        <p className="text-gray-500">Access your automatically generated whiteboard summaries.</p>
                    </div>

                    {notes.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-4">
                                <FaFileAlt className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No Notes Yet</h3>
                            <p className="text-gray-500 max-w-sm">
                                Generated AI notes from your live whiteboard sessions will appear here. Ask your mentor to enable the AI Assistant during your next meeting!
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-1 gap-6 overflow-hidden">
                            {/* Notes List Sidebar */}
                            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-700">
                                    Recent Sessions
                                </div>
                                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                    {notes.map((note) => (
                                        <button
                                            key={note._id}
                                            onClick={() => setSelectedNote(note)}
                                            className={`w-full text-left p-4 rounded-xl transition-all border ${selectedNote?._id === note._id
                                                    ? 'bg-purple-50 border-purple-200 shadow-sm'
                                                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                                }`}
                                        >
                                            <div className="font-semibold text-gray-900 truncate flex items-center gap-2 mb-1">
                                                <FaCalendarAlt className={selectedNote?._id === note._id ? 'text-purple-500' : 'text-gray-400'} />
                                                Session
                                            </div>
                                            <div className="text-xs text-gray-500 flex justify-between items-center">
                                                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                                <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Note Detail View */}
                            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                                {selectedNote ? (
                                    <>
                                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Notes from {new Date(selectedNote.createdAt).toLocaleDateString()}</h2>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Generated at {new Date(selectedNote.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => downloadNotes(selectedNote)}
                                                className="flex items-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                                            >
                                                <FaDownload /> Download TXT
                                            </button>
                                        </div>
                                        <div className="flex-1 p-8 overflow-y-auto bg-gray-50/50">
                                            <div className="prose prose-purple max-w-none text-gray-800 whitespace-pre-wrap font-medium leading-relaxed bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                                                {selectedNote.content}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400">
                                        Select a session to view notes.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ErrorBoundary>
    );
};

export default MeetingNotes;
