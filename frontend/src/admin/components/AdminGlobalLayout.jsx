import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import AdminGlobalHeader from './AdminGlobalHeader.jsx';

export default function AdminGlobalLayout() {
  const { user } = useAdminAuth();
  const location = useLocation();

  // If unauthenticated, redirect to login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // If user is flagged to change password on first login, force redirect
  if (user.must_change_password && location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      {/* Full-width top header with NO sidebar */}
      <AdminGlobalHeader />

      {/* Centered main content without any sidebar or sidebar offset */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
