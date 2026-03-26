import React, { useState, useEffect } from 'react';
import RoadmapEditor from '../components/RoadmapEditor'; // Fix relative path if needed, assuming same folder
import PerformancePage from '../pages/PerformancePage';
import * as api from '../api';
import { FaArrowLeft, FaMap, FaChartLine } from 'react-icons/fa';

const StudentDetail = ({ studentId, onBack }) => {
    const [activeTab, setActiveTab] = useState('roadmap');
    const [studentProfile, setStudentProfile] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const { data } = await api.fetchStudentProfileById(studentId);
                setStudentProfile(data);
            } catch (error) {
                console.error("Failed to fetch student profile", error);
            }
        };
        if (studentId) fetchStudent();
    }, [studentId]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                    <FaArrowLeft /> Back to Students
                </button>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('roadmap')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all
                            ${activeTab === 'roadmap' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FaMap /> Roadmap
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all
                            ${activeTab === 'performance' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FaChartLine /> Performance
                    </button>
                </div>
            </div>

            {activeTab === 'roadmap' ? (
                <RoadmapEditor studentId={studentId} onBack={onBack} />
            ) : (
                <div className="animate-fade-in-up">
                    <PerformancePage studentIdProp={studentId} isMentorView={true} />
                </div>
            )}
        </div>
    );
};

export default StudentDetail;
