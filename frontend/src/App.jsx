import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { AdminAuthProvider } from './admin/context/AdminAuthContext.jsx';
import { AdminCampProvider } from './admin/context/AdminCampContext.jsx';
import { subscribeToCampUpdates } from './utils/campEvents.js';
import { queryClient } from './queryClient.js';

export default function App() {
  useEffect(() => {
    const unsubscribe = subscribeToCampUpdates(() => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['public'] });
    });
    return unsubscribe;
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AdminAuthProvider>
          <AdminCampProvider>
            <AppRoutes />
          </AdminCampProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
