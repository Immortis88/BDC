import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PublicLayout from '../components/layout/PublicLayout.jsx';
import AdminGlobalLayout from '../admin/components/AdminGlobalLayout.jsx';
import AdminWorkspaceLayout from '../admin/components/AdminWorkspaceLayout.jsx';
import SuperAdminRoute from '../admin/components/SuperAdminRoute.jsx';

// Public Pages
const HomePage = lazy(() => import('../pages/HomePage.jsx'));
const AboutPage = lazy(() => import('../pages/AboutPage.jsx'));
const RegisterPage = lazy(() => import('../pages/RegisterPage.jsx'));
const GalleryPage = lazy(() => import('../pages/GalleryPage.jsx'));
const SupportersPage = lazy(() => import('../pages/SupportersPage.jsx'));
const TeamPublicPage = lazy(() => import('../pages/TeamPublicPage.jsx'));
const ContactPage = lazy(() => import('../pages/ContactPage.jsx'));
const FaqPage = lazy(() => import('../pages/FaqPage.jsx'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'));

// Admin Pages
const AdminLoginPage = lazy(() => import('../admin/pages/AdminLoginPage.jsx'));
const AdminChangePasswordPage = lazy(() => import('../admin/pages/AdminChangePasswordPage.jsx'));
const CampsAdminPage = lazy(() => import('../admin/pages/CampsAdminPage.jsx'));
const WebsiteAdminPage = lazy(() => import('../admin/pages/WebsiteAdminPage.jsx'));
const InboxAdminPage = lazy(() => import('../admin/pages/InboxAdminPage.jsx'));
const AdminsAndRolesPage = lazy(() => import('../admin/pages/AdminsAndRolesPage.jsx'));
const CampOverviewPage = lazy(() => import('../admin/pages/CampOverviewPage.jsx'));
const CampRegistrationsPage = lazy(() => import('../admin/pages/CampRegistrationsPage.jsx'));
const CampTeamPage = lazy(() => import('../admin/pages/CampTeamPage.jsx'));
const CampGalleryPage = lazy(() => import('../admin/pages/CampGalleryPage.jsx'));
const CampSponsorsPage = lazy(() => import('../admin/pages/CampSponsorsPage.jsx'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <LoadingSpinner size="lg" message="Loading interface..." />
    </div>
  );
}

// Helper to support /admin/camp/:campId/* alias redirecting to /admin/camps/:campId/*
function CampWorkspaceRedirect() {
  const params = useParams();
  const campId = params.campId;
  const rest = params['*'];
  const target = rest ? `/admin/camps/${campId}/${rest}` : `/admin/camps/${campId}/overview`;
  return <Navigate to={target} replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Website Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="camps" element={<Navigate to="/" replace />} />
          <Route path="camps/:campId" element={<Navigate to="/" replace />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="team" element={<TeamPublicPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="supporters" element={<SupportersPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        {/* Admin Authentication Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/change-password" element={<AdminChangePasswordPage />} />

        {/* Global Admin Redirects */}
        <Route path="/admin" element={<Navigate to="/admin/camp" replace />} />
        <Route path="/admin/camps" element={<Navigate to="/admin/camp" replace />} />

        {/* Global Central Administration (NO Sidebar, Full-Width Header) */}
        <Route element={<AdminGlobalLayout />}>
          <Route path="/admin/camp" element={<CampsAdminPage />} />
          <Route path="/admin/website" element={<WebsiteAdminPage />} />
          <Route path="/admin/inbox" element={<InboxAdminPage />} />
          <Route
            path="/admin/admins"
            element={
              <SuperAdminRoute>
                <AdminsAndRolesPage />
              </SuperAdminRoute>
            }
          />
        </Route>

        {/* Dedicated Camp Workspace (Camp Sidebar with Overview, Registrations, Team, Sponsors) */}
        <Route path="/admin/camps/:campId" element={<AdminWorkspaceLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<CampOverviewPage />} />
          <Route path="registrations" element={<CampRegistrationsPage />} />
          <Route path="team" element={<CampTeamPage />} />
          <Route path="gallery" element={<Navigate to="/admin/website?tab=GALLERY" replace />} />
          <Route path="sponsors" element={<CampSponsorsPage />} />
        </Route>

        {/* Aliases for singular camp path /admin/camp/:campId/* */}
        <Route path="/admin/camp/gallery" element={<Navigate to="/admin/website?tab=GALLERY" replace />} />
        <Route path="/admin/camp/:campId/gallery" element={<Navigate to="/admin/website?tab=GALLERY" replace />} />
        <Route path="/admin/camp/:campId/*" element={<CampWorkspaceRedirect />} />
        <Route path="/admin/camp/:campId" element={<CampWorkspaceRedirect />} />

        {/* Fallback 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
