import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    const userRole = profile.role;

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect unauthorized users to their appropriate dashboard
        if (userRole === 'mentor') return <Navigate to="/mentor-dashboard" replace />;
        if (userRole === 'student') return <Navigate to="/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
