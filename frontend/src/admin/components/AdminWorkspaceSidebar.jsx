import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Image as ImageIcon,
  HeartHandshake,
  ArrowLeft,
  Shield
} from 'lucide-react';

export default function AdminWorkspaceSidebar({
  campId,
  camp,
  isLiveCamp,
  isOpen,
  onClose
}) {
  const navigate = useNavigate();
  const { isSuperAdmin, hasPermission } = useAdminAuth();

  const campYear = camp?.camp_year || campId;
  const isRegOpen = camp?.registration_open ?? true;

  const canOverview = isSuperAdmin || hasPermission('camp.overview');
  const canRegistrations = isSuperAdmin || hasPermission('camp.registrations.view') || hasPermission('camp.registrations');
  const canTeam = isSuperAdmin || hasPermission('camp.team');
  const canSponsors = isSuperAdmin || hasPermission('camp.sponsors');

  const navItemClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
      isActive
        ? 'bg-[#981B24] text-white shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  const handleBackToCamps = () => {
    if (onClose) onClose();
    navigate('/admin/camp');
  };

  return (
    <>
      {/* Mobile Backdrop */}
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
        {/* Workspace Brand Header with BDC Logo navigating to /admin/camp */}
        <Link
          to="/admin/camp"
          className="p-4 border-b border-white/10 flex items-center gap-3 group focus:outline-none cursor-pointer"
          title="Return to Camp Management"
        >
          <img
            src="/assets/bdc_nav_logo.svg"
            alt="BDC Logo"
            className="h-8 w-auto object-contain shrink-0 transition-transform group-hover:scale-[1.02]"
          />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight group-hover:text-red-300 transition-colors">
              BDC ADMIN
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              WORKSPACE
            </p>
          </div>
        </Link>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col justify-between">
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
              {canOverview && (
                <NavLink
                  to={`/admin/camps/${campId}/overview`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Overview</span>
                  </div>
                </NavLink>
              )}

              {canRegistrations && (
                <NavLink
                  to={`/admin/camps/${campId}/registrations`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Registrations</span>
                  </div>
                </NavLink>
              )}

              {canTeam && (
                <NavLink
                  to={`/admin/camps/${campId}/team`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Team</span>
                  </div>
                </NavLink>
              )}

              {canSponsors && (
                <NavLink
                  to={`/admin/camps/${campId}/sponsors`}
                  className={navItemClass}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <HeartHandshake className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Partners & Sponsors</span>
                  </div>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Bottom Action: Back to Camps */}
          <div className="pt-4 mt-auto">
            <button
              type="button"
              onClick={handleBackToCamps}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Camps</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
