import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { KeyRound, ShieldAlert, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminChangePasswordPage() {
  const navigate = useNavigate();
  const { user, changePassword, logout } = useAdminAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN' && !user.must_change_password) {
      navigate('/admin/camp', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 12 || new TextEncoder().encode(newPassword).length > 72) {
      setError('Password must contain at least 12 characters and at most 72 UTF-8 bytes.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Password Updated',
          text: 'Your new permanent password is active. Welcome to the admin workspace.',
          confirmButtonColor: '#981B24'
        }).then(() => {
          navigate('/admin/camp', { replace: true });
        });
      } else {
        setError(res.message || 'Unable to update password.');
      }
    } catch (err) {
      setError('An error occurred while updating your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#981B24] text-white shadow-lg mb-4">
          <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#102B46] tracking-tight">
          Update Temporary Password
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          First-login security policy requires updating your temporary password.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block mb-0.5">First-Time Setup Required:</span>
              Your administrator account <strong>{user?.email}</strong> is using a temporary password. Choose a strong new password before proceeding.
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Current Temporary Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current / temporary password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                New Password (min 12 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#981B24] hover:bg-[#80141D] text-white text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                <span>{loading ? 'Updating Password...' : 'Save Password & Enter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={logout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Sign out and return later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
