import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Settings, LogOut, Menu } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import AdminSettingsModal from './AdminSettingsModal.jsx';

export default function AdminWorkspaceHeader({ campYear, onToggleSidebar }) {
  const { user, logout, isSuperAdmin, hasPermission } = useAdminAuth();
  const { campId: paramCampId } = useParams();
  const { selectedCampId, liveCampId } = useAdminCamp();
  const navigate = useNavigate();

  const effectiveCampId = paramCampId || selectedCampId || liveCampId || 2026;
  const targetDestination = isSuperAdmin ? '/admin/camp' : `/admin/camps/${effectiveCampId}/overview`;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-2.5 sm:px-6 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Workspace Branding with BDC logo navigating to authorized destination */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden cursor-pointer"
              aria-label="Open Workspace Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to={targetDestination}
              className="flex items-center gap-2.5 group focus:outline-none cursor-pointer"
              title={isSuperAdmin ? 'Return to Camp Management' : 'Return to Camp Overview'}
            >
              <img
                src="/assets/bdc_nav_logo.svg"
                alt="BDC Logo"
                className="h-8 w-auto object-contain shrink-0 transition-transform group-hover:scale-[1.02]"
              />
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-[#981B24] transition-colors">
                  BDC ADMIN
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-tight mt-0.5">
                  WORKSPACE
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Selected Camp Identity Pill Badge */}
          <div className="hidden md:flex items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-200/70 bg-rose-50/50 text-xs font-semibold text-slate-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#981B24]" />
              <span>BDC CAMP {campYear} · BDC {campYear}</span>
            </div>
          </div>

          {/* Right: Account Menu containing EXACTLY Admin Settings and Logout */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 text-xs sm:text-sm font-medium shadow-2xs cursor-pointer select-none"
              aria-expanded={dropdownOpen}
            >
              <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                {initial}
              </span>
              <span className="font-semibold text-slate-800 max-w-[160px] truncate">
                {displayName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150 divide-y divide-slate-100">
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
      </header>

      {/* Self-service settings modal */}
      <AdminSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
