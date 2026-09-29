import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import Swal from 'sweetalert2';

export default function SuperAdminRoute({ children }) {
  const { user, isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isSuperAdmin) {
      Swal.fire({
        icon: 'error',
        title: 'Access Restricted',
        text: 'Only Super Administrators have permission to access Administrator Management.',
        confirmButtonColor: '#981B24'
      });
      navigate('/admin/camp', { replace: true });
    }
  }, [user, isSuperAdmin, navigate]);

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/admin/camp" replace />;
  }

  return children;
}
