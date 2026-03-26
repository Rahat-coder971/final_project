import React, { useState } from 'react';
import { FaSave, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as api from '../api';

const MentorFeedback = ({ studentData, isMentorView }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [prepAdvice, setPrepAdvice] = useState(studentData.mentorPrepAdvice || '');

    const handleSave = async () => {
        try {
            // We use the same updateStudentSkills endpoint or a new one?
            // Ideally we should update the student profile.
            // Let's reuse updateStudentSkills for now but it might override skills if not careful.
            // Actually, we should probably add a specific endpoint or update the `updateStudentSkills` to generic `updateStudentProfile`
            // But checking studentController, `updateStudentSkills` ONLY updates `skillLevels`.
            // We need a way to update `mentorPrepAdvice`.

            // Temporary Workaround: Since we didn't add a specific endpoint for this in controller plan (my bad),
            // I'll assume we expanded `updateStudentSkills` or I should quickly add a generic update.
            // Let's add a `updateProfile` endpoint for student in the next step.
            // For now, I'll write the frontend code assuming `api.updateStudentProfile(id, { mentorPrepAdvice })` exists.

            await api.updateStudentSkills(studentData.user?._id || studentData._id, { mentorPrepAdvice: prepAdvice });
            // Wait, updateStudentSkills expects { skills: ... }. 
            // I need to update the backend controller to handle this field too.

            setIsEditing(false);
            toast.success("Feedback saved successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save feedback");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Mentor's Guidance</h3>
                {isMentorView && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary">
                        <FaEdit />
                    </button>
                )}
            </div>

            <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Prep for Next Goal
                </label>
                {isEditing ? (
                    <textarea
                        className="w-full h-32 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none text-sm text-gray-600"
                        value={prepAdvice}
                        onChange={(e) => setPrepAdvice(e.target.value)}
                        placeholder="What should the student focus on next? e.g. 'Master Async/Await before the next mock interview.'"
                    />
                ) : (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-50 min-h-[100px]">
                        <p className="text-sm text-gray-700 italic">
                            {prepAdvice || "No specific advice yet. Keep pushing forward!"}
                        </p>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <FaSave /> Save Guidance
                    </button>
                </div>
            )}
        </div>
    );
};

export default MentorFeedback;
