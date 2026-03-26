import React from 'react';
import { FaHome, FaUserGraduate, FaMapMarkedAlt, FaCalendarAlt, FaCommentDots, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const MentorSidebar = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'overview', name: 'Overview', icon: <FaHome /> },
        { id: 'students', name: 'My Students', icon: <FaUserGraduate /> },
        { id: 'meetings', name: 'Meetings', icon: <FaCalendarAlt /> },
        { id: 'roadmap', name: 'Roadmap Editor', icon: <FaMapMarkedAlt /> },
        { id: 'availability', name: 'Availability', icon: <FaCalendarAlt /> },
        { id: 'messages', name: 'Messages', icon: <FaCommentDots /> },
        { id: 'profile', name: 'Profile', icon: <FaUserCircle /> },
    ];

    return (
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed">
            <div className="flex items-center justify-center h-16 border-b border-gray-200">
                <span className="text-2xl font-bold text-primary tracking-tighter">
                    Elevate<span className="text-slate-900">Hub</span>
                </span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-2 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${activeTab === item.id
                                ? 'bg-blue-50 text-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <span className="text-lg mr-3">{item.icon}</span>
                            {item.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }}
                    className="flex w-full items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <FaSignOutAlt className="text-lg mr-3" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default MentorSidebar;
