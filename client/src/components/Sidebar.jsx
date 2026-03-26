import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaMap, FaChalkboardTeacher, FaRobot, FaSignOutAlt, FaChartLine, FaFire, FaFileAlt } from 'react-icons/fa';

const Sidebar = () => {
    const navItems = [
        { path: '/dashboard', name: 'Home', icon: <FaHome /> },
        { path: '/roadmap', name: 'My Roadmap', icon: <FaMap /> },
        { path: '/performance', name: 'Performance', icon: <FaChartLine /> },
        { path: '/mentors', name: 'Mentors', icon: <FaChalkboardTeacher /> },
        { path: '/ai-tools', name: 'AI Tools', icon: <FaRobot /> },
        { path: '/daily-check-in', name: 'Daily Check-in', icon: <FaFire /> },
        { path: '/meeting-notes', name: 'Meeting Notes', icon: <FaFileAlt /> },
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
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? 'bg-blue-50 text-primary'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <span className="text-lg mr-3">{item.icon}</span>
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <FaSignOutAlt className="text-lg mr-3" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
