import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronDown, Shield, ExternalLink, LogOut, Key } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import { useLocation, Link, useNavigate } from 'react-router-dom';

export default function AdminHeader({ onToggleSidebar }) {
  const { user, isSuperAdmin, logout } = useAdminAuth();
  const { selectedCamp, selectedCampId, isLiveCamp } = useAdminCamp();
  const location = useLocation();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isWorkspace = location.pathname.startsWith('/admin/camp');
  const campYear = selectedCamp?.camp_year || selectedCampId || 2026;

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

  const initial = user?.full_name ? user.full_name.charAt(0).toLowerCase() : 'a';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 py-2.5 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Context Brand Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            aria-label="Open Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#981B24] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 fill-white/20" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-none">
                BDC ADMIN
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-tight mt-0.5">
                {isWorkspace ? 'WORKSPACE' : 'CENTRAL ADMINISTRATION'}
              </div>
            </div>
          </div>
        </div>

        {/* Center: In Workspace mode, show the Camp Pill Badge */}
        {isWorkspace && (
          <div className="hidden md:flex items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-200/70 bg-rose-50/50 text-xs font-semibold text-slate-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#981B24]" />
              <span>BDC CAMP {campYear} · BDC {campYear}</span>
            </div>
          </div>
        )}

        {/* Right: User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 text-xs sm:text-sm font-medium shadow-2xs"
            aria-expanded={dropdownOpen}
          >
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
              {initial}
            </span>
            <span className="font-semibold text-slate-800 max-w-[120px] truncate">
              {user?.username || user?.full_name?.toLowerCase() || 'admin'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 text-xs text-slate-700 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Account summary header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-slate-900 text-sm truncate">{user?.full_name || 'Admin'}</div>
                <div className="text-slate-400 text-[11px] truncate">{user?.email}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  {isSuperAdmin ? 'Super Admin' : 'Regular Admin'}
                </div>
              </div>

              {/* Standard Quick Links */}
              <div className="py-1">
                <Link
                  to="/"
                  target="_blank"
                  className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-slate-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Public Website</span>
                  </span>
                </Link>

                <Link
                  to="/admin/change-password"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Change Password</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    navigate('/admin/login');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-700 text-left transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
