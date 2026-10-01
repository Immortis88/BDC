import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import AdminWorkspaceHeader from './AdminWorkspaceHeader.jsx';
import AdminWorkspaceSidebar from './AdminWorkspaceSidebar.jsx';
import Swal from 'sweetalert2';

export default function AdminWorkspaceLayout() {
  const { user, isSuperAdmin, liveCampId } = useAdminAuth();
  const { camps, selectCamp, selectedCamp } = useAdminCamp();
  const { campId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const numericCampId = Number(campId);

  // Security check: Regular admins can only access the Live Camp workspace
  useEffect(() => {
    if (!user || user.must_change_password) return;
    if (!isSuperAdmin && liveCampId && numericCampId && numericCampId !== Number(liveCampId)) {
      Swal.fire({
        icon: 'warning',
        title: 'Access Restricted',
        text: 'Regular administrators are permitted to manage only the currently live camp workspace.',
        confirmButtonColor: '#981B24'
      });
      navigate('/admin/camp', { replace: true });
    }
  }, [user, isSuperAdmin, liveCampId, numericCampId, navigate]);

  // Sync selectedCampId in context when URL changes, without changing liveCampId
  useEffect(() => {
    if (user && !user.must_change_password && numericCampId) {
      selectCamp(numericCampId);
    }
  }, [user, numericCampId, selectCamp]);

  // Keep hooks unconditional when login/password state changes.
  if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  if (user.must_change_password) return <Navigate to="/admin/change-password" replace />;

  const currentCamp = camps.find(c => c.id === numericCampId) || selectedCamp;
  const isLive = numericCampId === Number(liveCampId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      {/* Workspace top header */}
      <AdminWorkspaceHeader
        campYear={currentCamp?.camp_year || campId}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      <div className="flex-1 flex">
        {/* Workspace specific sidebar */}
        <AdminWorkspaceSidebar
          campId={campId}
          camp={currentCamp}
          isLiveCamp={isLive}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content area with left padding for desktop sidebar */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet context={{ campId: numericCampId, camp: currentCamp, isLiveCamp: isLive }} />
          </main>
        </div>
      </div>
    </div>
  );
}
