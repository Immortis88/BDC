import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { adminService } from '../services/adminService.js';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  RefreshCw,
  Key,
  X,
  Check,
  AlertTriangle,
  Lock,
  Mail,
  Copy,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import LoadingState from '../components/LoadingState.jsx';
import AdminSettingsModal from '../components/AdminSettingsModal.jsx';

// Complete 13 Permissions Catalogue
const MODULE_OPTIONS = [
  // Live Camp Modules
  {
    key: 'camp.overview',
    label: 'Camp Overview',
    desc: 'Live camp details, schedule, venue & visibility switches',
    category: 'Live Camp'
  },
  {
    key: 'camp.registrations',
    label: 'Donor Registrations',
    desc: 'Live camp donor list, search, status verification & CSV export',
    category: 'Live Camp'
  },
  {
    key: 'camp.team',
    label: 'Team Roster',
    desc: 'Coordinators & student volunteers roster with photo uploads',
    category: 'Live Camp'
  },
  {
    key: 'camp.sponsors',
    label: 'Partners & Sponsors',
    desc: 'Medical partners, blood banks, and sponsor organizations',
    category: 'Live Camp'
  },
  // Global Website CMS Modules
  {
    key: 'website.homepage',
    label: 'Homepage CMS',
    desc: 'Hero banner, inspiration section, impact numbers & CTA band',
    category: 'Website CMS'
  },
  {
    key: 'website.about',
    label: 'About Page CMS',
    desc: 'Mission, vision, core values, our story copy & intro photo slots',
    category: 'Website CMS'
  },
  {
    key: 'website.gallery',
    label: 'Photo Gallery Albums',
    desc: 'Global camp photo albums, photos, categories, and cover images',
    category: 'Website CMS'
  },
  {
    key: 'website.pages',
    label: 'Page Headers Copy',
    desc: 'Titles, subtitles, and intros for Team, Gallery & Supporters',
    category: 'Website CMS'
  },
  {
    key: 'website.registration_text',
    label: 'Registration Page Copy',
    desc: 'Donor instructions, eligibility criteria, and helpdesk guidance',
    category: 'Website CMS'
  },
  {
    key: 'website.notices',
    label: 'Notices & Alerts',
    desc: 'Announcement ticker, banner alerts, and urgent notices',
    category: 'Website CMS'
  },
  {
    key: 'website.faq',
    label: 'FAQ Management',
    desc: 'Frequently asked questions, categorized answers & homepage display',
    category: 'Website CMS'
  },
  {
    key: 'website.contact',
    label: 'Contact & Institutional Info',
    desc: 'Official email, phones, campus address, social media & footer',
    category: 'Website CMS'
  },
  // Inbox
  {
    key: 'inbox.read',
    label: 'Inquiries Inbox',
    desc: 'Inspect public contact submissions and toggle read status',
    category: 'Inbox'
  }
];

export default function AdminsAndRolesPage() {
  const { user, isSuperAdmin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [permModalAdmin, setPermModalAdmin] = useState(null);
  const [resetModalAdmin, setResetModalAdmin] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetting, setResetting] = useState(false);
  const [selfSettingsOpen, setSelfSettingsOpen] = useState(false);

  // Create form
  const [newAdminForm, setNewAdminForm] = useState({
    full_name: '',
    email: '',
    role: 'REGULAR_ADMIN',
    permissions: ['camp.overview', 'camp.team', 'camp.registrations']
  });

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminService.auth.getAdmins();
      if (res.success) {
        setAdmins(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins();
    }
  }, [isSuperAdmin]);

  const stats = useMemo(() => {
    const total = admins.length;
    const superCount = admins.filter(a => a.role === 'SUPER_ADMIN').length;
    const regularCount = admins.filter(a => a.role === 'REGULAR_ADMIN').length;
    const activeCount = admins.filter(a => a.is_active).length;
    return { total, superCount, regularCount, activeCount };
  }, [admins]);

  if (!isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <Lock className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Restricted Access</h2>
        <p className="text-xs text-slate-500">
          Only Super Administrators have permission to manage coordinator accounts and system roles.
        </p>
      </div>
    );
  }

  // Handle Save Permissions
  const handleSavePermissions = async () => {
    if (!permModalAdmin) return;
    const res = await adminService.auth.updateAdminPermissions(
      permModalAdmin.id,
      permModalAdmin.permissions
    );
    if (res.success) {
      setPermModalAdmin(null);
      await loadAdmins();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Permissions updated successfully.',
        showConfirmButton: false,
        timer: 2000
      });
    }
  };

  // Toggle permission key
  const handleToggleModule = (key) => {
    if (!permModalAdmin) return;
    const current = permModalAdmin.permissions || [];
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    setPermModalAdmin({ ...permModalAdmin, permissions: next });
  };

  const handleSelectAll = () => {
    if (!permModalAdmin) return;
    setPermModalAdmin({
      ...permModalAdmin,
      permissions: MODULE_OPTIONS.map(m => m.key)
    });
  };

  const handleDeselectAll = () => {
    if (!permModalAdmin) return;
    setPermModalAdmin({
      ...permModalAdmin,
      permissions: []
    });
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetModalAdmin) return;
    if (!newPasswordInput || newPasswordInput.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'Password must be at least 8 characters long.' });
      return;
    }

    setResetting(true);
    try {
      const res = await adminService.auth.resetAdminPassword(resetModalAdmin.id, newPasswordInput);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Password Reset',
          text: `Password updated for ${resetModalAdmin.email}. User must change it on first login.`,
          confirmButtonColor: '#B91C1C'
        });
        setResetModalAdmin(null);
        setNewPasswordInput('');
        await loadAdmins();
      } else {
        Swal.fire({ icon: 'error', title: 'Reset Failed', text: res.message });
      }
    } finally {
      setResetting(false);
    }
  };

  // Toggle Role (Super <-> Regular)
  const handleToggleRole = async (adm) => {
    const newRole = adm.role === 'SUPER_ADMIN' ? 'REGULAR_ADMIN' : 'SUPER_ADMIN';
    const actionLabel = newRole === 'SUPER_ADMIN' ? 'Promote to Super Admin' : 'Make Regular Admin';

    const confirm = await Swal.fire({
      title: `${actionLabel}?`,
      text: `Change role for ${adm.full_name} (${adm.email}) to ${newRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'Regular Administrator'}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#B91C1C',
      confirmButtonText: 'Yes, change role'
    });

    if (confirm.isConfirmed) {
      const res = await adminService.auth.updateAdminRole(adm.id, newRole);
      if (res.success) {
        await loadAdmins();
        Swal.fire({ icon: 'success', title: 'Role Updated', text: res.message, timer: 1500 });
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: res.message });
      }
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (adm) => {
    const nextStatus = !adm.is_active;
    const res = await adminService.auth.toggleAdminActive(adm.id, nextStatus);
    if (res.success) {
      await loadAdmins();
    } else {
      Swal.fire({ icon: 'error', title: 'Action Failed', text: res.message });
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (adm) => {
    if (adm.id === user?.id) {
      Swal.fire({
        icon: 'error',
        title: 'Action Denied',
        text: 'You cannot delete your own administrator account.',
        confirmButtonColor: '#B91C1C'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Delete Administrator?',
      text: `Are you sure you want to permanently delete ${adm.full_name} (${adm.email})? All active sessions will be revoked immediately.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Delete Account'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await adminService.auth.deleteAdmin(adm.id);
        if (res.success) {
          await loadAdmins();
          Swal.fire({
            icon: 'success',
            title: 'Account Deleted',
            text: res.message || 'Administrator removed successfully.',
            timer: 1800,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: res.message || 'Could not delete administrator.',
            confirmButtonColor: '#B91C1C'
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err?.message || 'An unexpected error occurred.',
          confirmButtonColor: '#B91C1C'
        });
      }
    }
  };

  // Create Admin Submit
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const res = await adminService.auth.createAdmin(newAdminForm);
    if (res.success) {
      setCreateModalOpen(false);
      await loadAdmins();
      Swal.fire({
        icon: 'success',
        title: 'Administrator Created',
        text: `Temporary password: ${res.tempPassword}. Share this securely.`,
        confirmButtonColor: '#B91C1C'
      });
    } else {
      Swal.fire({ icon: 'error', title: 'Failed', text: res.message });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-12">
      {/* Back to Camps Link */}
      <div>
        <Link
          to="/admin/camp"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Camps</span>
        </Link>
      </div>

      {/* Top Header matching reference 05 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#B91C1C]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Administrator Accounts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage coordinator accounts, role privileges, and system credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSelfSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <Key className="w-4 h-4 text-slate-500" />
            <span>My Password</span>
          </button>

          <button
            type="button"
            onClick={loadAdmins}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#981B24] hover:bg-[#80141D] text-white text-xs sm:text-sm font-semibold shadow-md shadow-red-900/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Administrator</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards matching reference 05 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Admins
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {stats.total}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-2xs bg-emerald-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Super Admins
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {stats.superCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Regular Admins
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {stats.regularCount}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Status
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {stats.activeCount} / {stats.total}
          </div>
        </div>
      </div>

      {/* Administrators Table matching reference 05 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">ADMINISTRATOR</th>
                <th className="py-3.5 px-5">ROLE</th>
                <th className="py-3.5 px-5">MODULE PERMISSIONS</th>
                <th className="py-3.5 px-5">STATUS</th>
                <th className="py-3.5 px-5">LAST LOGIN</th>
                <th className="py-3.5 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {admins.map((adm) => {
                const isCurrent = adm.id === user.id;
                const isSuper = adm.role === 'SUPER_ADMIN';

                return (
                  <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Administrator Name and Email */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{adm.full_name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {adm.email}
                      </div>
                    </td>

                    {/* Role Pill */}
                    <td className="py-4 px-5">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Super Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <Shield className="w-3.5 h-3.5 text-slate-500" />
                          <span>Regular Admin</span>
                        </span>
                      )}
                    </td>

                    {/* Module Permissions Count / Pills */}
                    <td className="py-4 px-5">
                      {isSuper ? (
                        <span className="text-xs text-slate-500 font-medium">
                          All Modules (Super Admin)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {adm.permissions && adm.permissions.length > 0 ? (
                            adm.permissions.slice(0, 3).map((p, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                                {p.replace('camp.', '').replace('website.', '')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">None assigned</span>
                          )}
                          {adm.permissions && adm.permissions.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-bold">
                              +{adm.permissions.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        adm.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${adm.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{adm.is_active ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-4 px-5 text-xs text-slate-500">
                      {adm.last_login_at ? new Date(adm.last_login_at).toLocaleDateString() : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      {!isSuper && (
                        <button
                          type="button"
                          onClick={() => setPermModalAdmin({ ...adm, permissions: adm.permissions || [] })}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Permissions
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleRole(adm)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {isSuper ? 'Make Regular' : 'Promote to Super'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetModalAdmin(adm);
                          setNewPasswordInput('');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        title="Reset Password"
                      >
                        <Key className="w-3 h-3 text-slate-500" />
                        <span>Reset</span>
                      </button>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(adm)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            adm.is_active
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {adm.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(adm)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Administrator"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: RESET PASSWORD MODAL matching reference 04 */}
      {resetModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#B91C1C]">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                  <p className="text-xs text-slate-500">Revoke credentials & generate new access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Note text */}
            <p className="text-xs text-slate-600 leading-relaxed">
              Set a new temporary or permanent password for <strong className="text-slate-800">{resetModalAdmin.email}</strong>. The administrator will be required to change it on their next sign-in.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  NEW PASSWORD *
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Min 8 chars, uppercase, digit, special"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetModalAdmin(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{resetting ? 'Resetting...' : 'Reset Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MODULE PERMISSIONS MODAL matching reference 06 */}
      {permModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#B91C1C]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Module Permissions</h3>
                  <p className="text-xs text-slate-500">Configure access for {permModalAdmin.full_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPermModalAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction */}
            <p className="text-xs text-slate-600">
              Select which modules <strong className="text-slate-800">{permModalAdmin.email}</strong> can manage in camp workspaces.
            </p>

            {/* Count & Select All */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-bold text-slate-800">
                Modules ({permModalAdmin.permissions?.length || 0} / {MODULE_OPTIONS.length} selected)
              </span>
              <div className="space-x-2 text-slate-500">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="hover:text-red-700 font-semibold"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="hover:text-red-700 font-semibold"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* 2-Column Grid of 13 Module Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {MODULE_OPTIONS.map((mod) => {
                const isSelected = permModalAdmin.permissions?.includes(mod.key);

                return (
                  <div
                    key={mod.key}
                    onClick={() => handleToggleModule(mod.key)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by div click
                      className="mt-0.5 rounded text-[#B91C1C] focus:ring-red-500/20"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          {mod.label}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold shrink-0">
                          {mod.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug mt-1">
                        {mod.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Amber Warning Box matching reference 06 */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Updating permissions will invalidate active sessions for this admin, requiring them to refresh with new privileges.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPermModalAdmin(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Save Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD ADMINISTRATOR MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Administrator Account</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newAdminForm.full_name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@skit.ac.in"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Type</label>
                <select
                  value={newAdminForm.role}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                >
                  <option value="REGULAR_ADMIN">Regular Administrator</option>
                  <option value="SUPER_ADMIN">Super Administrator (Full System Access)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold shadow-xs"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Self-service password modal */}
      <AdminSettingsModal
        isOpen={selfSettingsOpen}
        onClose={() => setSelfSettingsOpen(false)}
      />
    </div>
  );
}
