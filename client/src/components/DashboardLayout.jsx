import React from 'react';
import Sidebar from './Sidebar';
import AIChatbot from './AIChatbot';

const DashboardLayout = ({ children, sidebar }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex relative">
            {sidebar || <Sidebar />}
            <div className="flex-1 md:ml-64">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </div>
            <AIChatbot />
        </div>
    );
};

export default DashboardLayout;
