import React, { useState, useEffect } from 'react';
import { FaSave, FaCheckCircle, FaUndo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as api from '../api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM'
];

const AvailabilityPainter = () => {
    const [schedule, setSchedule] = useState({}); // { "Mon-10:00 AM": true }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const { data } = await api.fetchMentorProfile();
            // Convert from ["Monday 10:00 AM"] to { "Mon-10:00 AM": true }
            const initialSchedule = {};
            if (data.availability) {
                data.availability.forEach(slot => {
                    // slot format: "Day Time" e.g "Mon 08:00 AM"
                    const parts = slot.split(' ');
                    const day = parts[0];
                    const time = parts.slice(1).join(' ');
                    initialSchedule[`${day}-${time}`] = true;
                });
            }
            setSchedule(initialSchedule);
        } catch (error) {
            console.error("Failed to load availability", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSlot = (day, time) => {
        const key = `${day}-${time}`;
        setSchedule(prev => {
            const newSchedule = { ...prev };
            if (newSchedule[key]) {
                delete newSchedule[key];
            } else {
                newSchedule[key] = true;
            }
            return newSchedule;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        // Convert back to ["Mon 10:00 AM"]
        const availabilityArray = Object.keys(schedule).map(key => {
            const [day, time] = key.split('-');
            return `${day} ${time}`;
        });

        try {
            await api.updateMentorProfile({ availability: availabilityArray });
            toast.success('Availability saved successfully!');
        } catch (error) {
            console.error("Failed to save", error);
            const msg = error.response?.data?.message || error.message || 'Failed to save availability.';
            toast.error(`Error: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading your schedule...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Weekly Availability</h2>
                    <p className="text-sm text-gray-500">Click cells to toggle your available slots.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Saving...' : <><FaSave /> Save Changes</>}
                </button>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-8 gap-1 mb-2">
                        <div className="h-10"></div> {/* Spacer */}
                        {DAYS.map(day => (
                            <div key={day} className="h-10 flex items-center justify-center font-bold text-gray-700 bg-gray-50 rounded-lg">
                                {day}
                            </div>
                        ))}
                    </div>

                    {HOURS.map(time => (
                        <div key={time} className="grid grid-cols-8 gap-1 mb-1">
                            <div className="h-10 flex items-center justify-end pr-4 text-xs font-medium text-gray-500">
                                {time}
                            </div>
                            {DAYS.map(day => {
                                const isSelected = schedule[`${day}-${time}`];
                                return (
                                    <div
                                        key={`${day}-${time}`}
                                        onClick={() => toggleSlot(day, time)}
                                        className={`h-10 rounded-lg cursor-pointer transition-all duration-200 border border-transparent 
                                            ${isSelected
                                                ? 'bg-blue-500 shadow-sm scale-95'
                                                : 'bg-gray-50 hover:bg-blue-50 hover:border-blue-200'
                                            }`}
                                    >
                                        {isSelected && (
                                            <div className="w-full h-full flex items-center justify-center text-white text-xs">
                                                <FaCheckCircle />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                <FaUndo className="text-blue-500 mt-1" />
                <div className="text-sm text-blue-800">
                    <strong>Tip:</strong> Students will only be able to book sessions during these times. Changes affect future bookings only.
                </div>
            </div>
        </div>
    );
};

export default AvailabilityPainter;
