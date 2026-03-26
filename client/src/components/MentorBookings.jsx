import React, { useEffect, useState } from 'react';
import { FaVideo, FaCalendarAlt, FaClock, FaUser, FaHistory, FaStar } from 'react-icons/fa';
import * as api from '../api';
import GradingModal from './GradingModal';

const MentorBookings = () => {
    const [upcoming, setUpcoming] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const { data } = await api.fetchBookings();

            const now = new Date();
            const upcomingBookings = [];
            const pastBookings = [];

            data.forEach(booking => {
                const bookingDate = new Date(booking.date);
                if (bookingDate > now && booking.status !== 'cancelled') {
                    upcomingBookings.push(booking);
                } else {
                    pastBookings.push(booking);
                }
            });

            // Sort upcoming by date (nearest first)
            upcomingBookings.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Sort history by date (newest first)
            pastBookings.sort((a, b) => new Date(b.date) - new Date(a.date));

            setUpcoming(upcomingBookings);
            setHistory(pastBookings);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGrading = (booking) => {
        setSelectedBooking(booking);
        setIsGradingModalOpen(true);
    };

    const handleGradeSuccess = () => {
        fetchBookings(); // Refresh list to show updated status/score if we display it
    };

    if (loading) return <div className="p-10 text-center">Loading meetings...</div>;

    return (
        <div className="space-y-8">
            <GradingModal
                isOpen={isGradingModalOpen}
                onClose={() => setIsGradingModalOpen(false)}
                booking={selectedBooking}
                onGradeSuccess={handleGradeSuccess}
            />

            {/* Upcoming Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" /> Upcoming Sessions
                </h2>

                {upcoming.length > 0 ? (
                    <div className="grid gap-4">
                        {upcoming.map((booking) => (
                            <div key={booking._id} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                                        {new Date(booking.date).getDate()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">
                                            Session with {booking.student?.name || 'Student'}
                                        </h3>
                                        <div className="text-sm text-gray-500 space-y-1">
                                            <p className="flex items-center gap-2">
                                                <FaClock className="text-gray-400" />
                                                {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {' • '}
                                                {new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <FaUser className="text-gray-400" />
                                                Mentorship Session
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <a
                                        href={`/meeting/${booking.meetingLink ? booking.meetingLink.split('/').pop() : booking._id}`}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        <FaVideo /> Join Meeting
                                    </a>
                                    <button
                                        onClick={() => handleOpenGrading(booking)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <FaStar /> Grade
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center text-gray-500">
                        <p>No upcoming sessions scheduled. Time to relax! 🌴</p>
                    </div>
                )}
            </div>

            {/* History Section */}
            {history.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 mt-12">
                        <FaHistory className="text-gray-400" /> Session History
                    </h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date(booking.date).toLocaleDateString()}
                                            <span className="text-gray-400 text-xs ml-2">
                                                {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {booking.student?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {booking.status || 'Past'}
                                            </span>
                                            {booking.outcome && booking.outcome.score && (
                                                <span className="ml-2 text-xs font-bold text-indigo-600">
                                                    Score: {booking.outcome.score}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleOpenGrading(booking)}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
                                            >
                                                <FaStar /> {booking.outcome ? 'Update Grade' : 'Grade'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorBookings;
