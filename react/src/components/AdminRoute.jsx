import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Wraps a route so only ROLE_ADMIN users can access it.
 * Unauthenticated users → /login
 * Authenticated non-admins → /dashboard (with a 403 state flag)
 */
const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="w-10 h-10 border-4 border-white/20 border-t-violet-400 rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/dashboard" state={{ forbidden: true }} replace />;

    return children;
};

export default AdminRoute;
