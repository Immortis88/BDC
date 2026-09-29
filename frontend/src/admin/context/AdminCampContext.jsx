import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/adminService.js';
import { useAdminAuth } from './AdminAuthContext.jsx';

const AdminCampContext = createContext(null);

export function AdminCampProvider({ children }) {
  const { user, isSuperAdmin, liveCampId, setLiveCampId } = useAdminAuth();
  const [camps, setCamps] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState(null);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshCamps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.camps.getAll();
      if (res.success && res.data) {
        setCamps(res.data);
        if (res.liveCampId !== undefined) {
          setLiveCampId(res.liveCampId);
        }

        // Auto-select live camp or first available
        if (res.data.length > 0) {
          setSelectedCampId(prev => {
            if (prev && res.data.some(c => c.id === prev)) return prev;
            return res.liveCampId || res.data[0].id;
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [setLiveCampId]);

  useEffect(() => {
    if (user) {
      refreshCamps();
    }
  }, [user, refreshCamps]);

  // If user is regular admin, force selection to liveCampId
  useEffect(() => {
    if (!isSuperAdmin && liveCampId) {
      setSelectedCampId(liveCampId);
    }
  }, [isSuperAdmin, liveCampId]);

  // Load details for selected camp
  useEffect(() => {
    let mounted = true;
    async function fetchCampDetails() {
      if (!selectedCampId) {
        setSelectedCamp(null);
        return;
      }
      const res = await adminService.camps.getById(selectedCampId);
      if (mounted && res.success) {
        setSelectedCamp(res.data);
      }
    }
    fetchCampDetails();
    return () => { mounted = false; };
  }, [selectedCampId]);

  const selectCamp = (campId) => {
    const id = Number(campId);
    if (!isSuperAdmin && id !== Number(liveCampId)) {
      return false;
    }
    setSelectedCampId(id);
    return true;
  };

  return (
    <AdminCampContext.Provider
      value={{
        camps,
        selectedCampId,
        selectedCamp,
        loading,
        refreshCamps,
        selectCamp,
        isLiveCamp: Boolean(liveCampId && selectedCampId === liveCampId)
      }}
    >
      {children}
    </AdminCampContext.Provider>
  );
}

export function useAdminCamp() {
  const context = useContext(AdminCampContext);
  if (!context) {
    throw new Error('useAdminCamp must be used within an AdminCampProvider');
  }
  return context;
}
