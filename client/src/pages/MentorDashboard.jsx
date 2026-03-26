import React, { useState } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import DashboardLayout from '../components/DashboardLayout';
import MentorSidebar from '../components/MentorSidebar';
import DashboardOverview from '../components/DashboardOverview';
import MyStudents from '../components/MyStudents';
import StudentDetail from '../components/StudentDetail';
import AvailabilityPainter from '../components/AvailabilityPainter';
import Messages from '../components/Messages';
import MentorProfile from '../components/MentorProfile';
import MentorBookings from '../components/MentorBookings';

// ... (PlaceholderPage remains same)

const MentorDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    const handleViewStudentRoadmap = (studentId) => {
        console.log("View Student Roadmap Triggered:", studentId);
        setSelectedStudentId(studentId);
        setActiveTab('roadmap');
    };
    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <DashboardOverview />;
            case 'students':
                return <MyStudents onViewRoadmap={handleViewStudentRoadmap} />;
            case 'meetings':
                return <MentorBookings />;
            case 'roadmap':
                // Now using StudentDetail which handles both Roadmap and Performance
                return <StudentDetail studentId={selectedStudentId} onBack={() => setActiveTab('students')} />;
            case 'availability':
                return <AvailabilityPainter />;
            case 'messages':
                return <Messages />;
            case 'profile':
                return <MentorProfile />;
            default:
                return <DashboardOverview />;
        }
    };

    return (
        <ErrorBoundary>
            <DashboardLayout sidebar={<MentorSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 capitalize">
                        {activeTab === 'overview' ? 'Dashboard Overview' : activeTab.replace('-', ' ')}
                    </h1>
                </div>
                <ErrorBoundary>
                    {renderContent()}
                </ErrorBoundary>
            </DashboardLayout>
        </ErrorBoundary>
    );
};

export default MentorDashboard;
