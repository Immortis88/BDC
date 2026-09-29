import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  Settings,
  LogOut,
  Calendar,
  Globe,
  Inbox,
  ExternalLink
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import AdminSettingsModal from './AdminSettingsModal.jsx';

export default function AdminGlobalHeader() {
  const { user, logout, isSuperAdmin, hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Permission checks for global navigation
  const canAccessWebsite = isSuperAdmin ||
    hasPermission('website.homepage') ||
    hasPermission('website.sections') ||
    hasPermission('website.notices') ||
    hasPermission('website.faq') ||
    hasPermission('website.contact');

  const canAccessInbox = isSuperAdmin || hasPermission('inbox.read');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/admin/login');
  };

  const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A';
  const displayName = user?.full_name || user?.username || 'Admin';

  const navItemClass = (path) => {
    const isActive = location.pathname === path || (path === '/admin/camp' && location.pathname.startsWith('/admin/camp'));
    return `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
      isActive
        ? 'bg-[#981B24] text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
    }`;
  };

  return (
    <>
      <header className="w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 py-2.5 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Global Central Administration Branding with BDC Logo */}
          <Link
            to="/admin/camp"
            className="flex items-center gap-3 group focus:outline-none cursor-pointer shrink-0"
            title="BDC Admin - Central Administration"
          >
            <img
              src="/assets/bdc_nav_logo.svg"
              alt="BDC Logo"
              className="h-8 sm:h-9 w-auto object-contain shrink-0 transition-transform group-hover:scale-[1.02]"
            />
            <div>
              <div className="text-sm font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-[#981B24] transition-colors">
                BDC ADMIN
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight mt-0.5">
                CENTRAL ADMINISTRATION
              </div>
            </div>
          </Link>

          {/* Center: Global Navigation Navbar (Camps, Website CMS, Inbox) */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <Link
              to="/admin/camp"
              className={navItemClass('/admin/camp')}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Camps</span>
            </Link>

            {canAccessWebsite && (
              <Link
                to="/admin/website"
                className={navItemClass('/admin/website')}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website CMS</span>
              </Link>
            )}

            {canAccessInbox && (
              <Link
                to="/admin/inbox"
                className={navItemClass('/admin/inbox')}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Inbox</span>
              </Link>
            )}
          </nav>

          {/* Right: Quick Links & Account Menu */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Public Site Quick Link */}
            <Link
              to="/"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              title="View Public Website"
            >
              <span>View Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Account Menu (Admin Settings + Logout) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 text-xs sm:text-sm font-medium shadow-2xs cursor-pointer select-none"
                aria-expanded={dropdownOpen}
              >
                <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {initial}
                </span>
                <span className="font-semibold text-slate-800 max-w-[140px] truncate hidden sm:inline">
                  {displayName}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu: Admin Settings (shifts Administrator Management here) & Logout */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        if (isSuperAdmin) {
                          navigate('/admin/admins');
                        } else {
                          setSettingsOpen(true);
                        }
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-slate-700 text-left font-medium transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Admin Settings</span>
                      </div>
                      {isSuperAdmin && (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-[#981B24] text-[10px] font-bold border border-rose-200">
                          Super Admin
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-red-700 text-left font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Self-service settings modal for regular admin password updates */}
      <AdminSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
