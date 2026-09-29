import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import {
  Calendar,
  Globe,
  Inbox,
  Shield,
  LayoutDashboard,
  ClipboardList,
  Users,
  Image as ImageIcon,
  HeartHandshake,
  ArrowLeft,
  Lock
} from 'lucide-react';

export default function AdminSidebar({ isOpen, onClose }) {
  const { user, isSuperAdmin, logout } = useAdminAuth();
  const { selectedCamp, selectedCampId, isLiveCamp } = useAdminCamp();
  const location = useLocation();
  const navigate = useNavigate();

  const isWorkspace = location.pathname.startsWith('/admin/camp');
  const campYear = selectedCamp?.camp_year || selectedCampId || 2026;
  const isRegOpen = selectedCamp?.is_registration_open ?? true;

  const navItemClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
      isActive
        ? 'bg-[#981B24] text-white shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0B132B] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#981B24] flex items-center justify-center font-bold text-white shadow-sm">
            <Shield className="w-4 h-4 fill-white/20" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              BDC ADMIN
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {isWorkspace ? 'WORKSPACE' : 'CENTRAL ADMINISTRATION'}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col justify-between">
          {/* If NOT Workspace: Show Global Central Navigation ONLY */}
          {!isWorkspace ? (
            <div className="space-y-1">
              <NavLink to="/admin/camps" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Camps</span>
                </div>
              </NavLink>

              <NavLink to="/admin/website" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Website CMS</span>
                </div>
              </NavLink>

              <NavLink to="/admin/inbox" className={navItemClass} onClick={onClose}>
                <div className="flex items-center gap-3">
                  <Inbox className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Inquiries Inbox</span>
                </div>
              </NavLink>

              {/* Admins & Roles: Super Admin Only */}
              {isSuperAdmin ? (
                <NavLink to="/admin/admins" className={navItemClass} onClick={onClose}>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Admins & Roles</span>
                  </div>
                </NavLink>
              ) : (
                <div
                  title="Only Super Admin can manage administrator roles and accounts"
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-slate-600 opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 shrink-0 text-slate-600" />
                    <span>Admins & Roles</span>
                  </div>
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ) : (
            /* If IN Workspace: Show Camp Active Card + Workspace Modules ONLY */
            <div className="space-y-4">
              {/* Active Camp Box */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div>
                  <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                    BDC CAMP {campYear}
                  </div>
                  <div className="text-base font-bold text-white tracking-tight">
                    BDC {campYear}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {isLiveCamp && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      <span>★</span> Live on Web
                    </span>
                  )}
                  {isRegOpen ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <span>✓</span> Reg Open
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                      <span>✕</span> Reg Closed
                    </span>
                  )}
                </div>
              </div>

              {/* Workspace Navigation Links */}
              <nav className="space-y-1">
                <NavLink to="/admin/camp/overview" className={navItemClass} onClick={onClose}>
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Camp Management</span>
                  </div>
                </NavLink>

                <NavLink to="/admin/camp/team" className={navItemClass} onClick={onClose}>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Team</span>
                  </div>
                </NavLink>

                <NavLink to="/admin/camp/sponsors" className={navItemClass} onClick={onClose}>
                  <div className="flex items-center gap-3">
                    <HeartHandshake className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Partners</span>
                  </div>
                </NavLink>

                <NavLink to="/admin/camp/registrations" className={navItemClass} onClick={onClose}>
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Registration</span>
                  </div>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 mt-auto">
            {isWorkspace && (
              <button
                type="button"
                onClick={() => {
                  if (onClose) onClose();
                  navigate('/admin/camps');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch Camp</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
