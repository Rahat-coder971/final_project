import React, { useEffect, useState } from 'react';
import { FaUserGraduate, FaMapMarkedAlt, FaComments } from 'react-icons/fa';
import * as api from '../api';

const MyStudents = ({ onViewRoadmap }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const { data } = await api.fetchMyStudents();
                console.log("MyStudents API Data:", data);
                if (Array.isArray(data)) {
                    // Ensure unique students by ID to prevent key duplicates
                    const uniqueStudents = Array.from(new Map(data.map(s => [s._id, s])).values());
                    setStudents(uniqueStudents);
                } else {
                    console.error("MyStudents API returned non-array:", data);
                    setStudents([]);
                }
            } catch (error) {
                console.error("Error fetching students:", error);
                setStudents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    if (loading) return <div className="p-10 text-center">Loading students...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">My Students ({students.length})</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                </div>
            </div>

            {students.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map((student) => (
                        <div key={student._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${student.name}&background=random`}
                                            alt={student.name}
                                            className="w-12 h-12 rounded-full"
                                        />
                                        <div>
                                            <h3 className="font-bold text-gray-900">{student.name}</h3>
                                            <p className="text-sm text-gray-500">{student.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Goal: <span className="text-primary">{student.goal}</span></p>

                                    <div className="mb-1 flex justify-between text-xs font-medium text-gray-500">
                                        <span>Progress</span>
                                        <span>{student.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${student.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => onViewRoadmap(student._id)}
                                        className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-100 flex items-center justify-center gap-2"
                                    >
                                        <FaMapMarkedAlt /> View Details
                                    </button>
                                    <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-100">
                                        <FaComments />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
                        <FaUserGraduate />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No students yet</h3>
                    <p className="text-gray-500 mt-1">Once students book a session with you, they'll appear here.</p>
                </div>
            )}
        </div>
    );
};

export default MyStudents;
