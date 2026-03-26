import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Messages from '../components/Messages';

const MessagesPage = () => {
    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
            <Messages />
        </DashboardLayout>
    );
};

export default MessagesPage;
