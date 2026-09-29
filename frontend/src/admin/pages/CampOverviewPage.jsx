import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import { adminService } from '../services/adminService.js';
import { queryClient } from '../../queryClient.js';
import { notifyCampUpdated } from '../../utils/campEvents.js';
import {
  Calendar,
  MapPin,
  Edit2,
  Users,
  Image as ImageIcon,
  HeartHandshake,
  ClipboardList,
  Check,
  X,
  Clock,
  ShieldCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import LoadingState from '../components/LoadingState.jsx';
import {
  formatCampDate,
  formatOperatingHours,
  toDateInputValue,
  toTimeInputValue
} from '../../utils/dateUtils.js';

export default function CampOverviewPage() {
  const { campId: paramCampId } = useParams();
  const { isSuperAdmin, hasPermission, liveCampId } = useAdminAuth();
  const { selectedCamp, selectedCampId, refreshCamps } = useAdminCamp();

  const effectiveCampId = Number(paramCampId) || Number(selectedCampId) || 2026;
  const isThisCampLive = effectiveCampId === Number(liveCampId);

  const [campData, setCampData] = useState(null);
  const [visibility, setVisibility] = useState({
    team: true,
    sponsors: true,
    registration: true
  });
  const [stats, setStats] = useState({
    total: 0,
    donated: 0,
    notDonated: 0
  });
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const canEdit = isSuperAdmin || hasPermission('camp.overview', effectiveCampId);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!effectiveCampId) return;
      setLoading(true);
      try {
        const [campRes, regRes] = await Promise.all([
          adminService.camps.getById(effectiveCampId),
          adminService.registrations.getByCamp(effectiveCampId)
        ]);

        if (mounted && campRes.success) {
          setCampData(campRes.data);
          if (campRes.visibility) setVisibility(campRes.visibility);
          setEditForm({
            ...campRes.data,
            camp_date: toDateInputValue(campRes.data.camp_date),
            starts_at: toTimeInputValue(campRes.data.starts_at) || '09:00',
            ends_at: toTimeInputValue(campRes.data.ends_at) || '16:00',
            public_title: campRes.data.public_title || '',
            internal_name: campRes.data.internal_name || '',
            venue: campRes.data.venue || '',
            venue_subtitle: campRes.data.venue_subtitle || '',
            description: campRes.data.description || ''
          });
        }

        if (mounted && regRes.success) {
          const regs = regRes.data || [];
          const donatedCount = regs.filter(r => (r.donor_status || r.outcome) === 'DONATED').length;
          const notDonatedCount = regs.filter(r => (r.donor_status || r.outcome) === 'NOT_DONATED').length;
          setStats({
            total: regRes.stats?.total !== undefined ? regRes.stats.total : regs.length,
            donated: regRes.stats?.donated !== undefined ? regRes.stats.donated : donatedCount,
            notDonated: regRes.stats?.not_donated !== undefined ? regRes.stats.not_donated : notDonatedCount
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [effectiveCampId]);

  const activeDisplayCamp = campData || selectedCamp;

  const handleToggleRegistration = async () => {
    if (!activeDisplayCamp) return;
    const nextVal = !activeDisplayCamp.registration_open;
    const res = await adminService.camps.update(effectiveCampId, { registration_open: nextVal });
    if (res.success) {
      setCampData(prev => prev ? { ...prev, registration_open: nextVal } : prev);
      await refreshCamps();
      notifyCampUpdated({ campId: effectiveCampId, action: 'registration' });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Registration ${nextVal ? 'Opened' : 'Closed'}`,
        showConfirmButton: false,
        timer: 1800
      });
    }
  };

  const handleToggleVisibility = async (moduleKey) => {
    const nextVal = !visibility[moduleKey];
    try {
      const res = await adminService.camps.updatePageVisibility(effectiveCampId, moduleKey, nextVal);
      if (!res.success) throw new Error(res.message || 'Could not update website visibility.');
      setVisibility(prev => ({ ...prev, ...(res.visibility || { [moduleKey]: nextVal }) }));
      notifyCampUpdated({ campId: effectiveCampId, action: 'visibility' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Visibility update failed', text: error.message || 'Please try again.' });
    }
  };

  const handleOpenEdit = () => {
    if (!activeDisplayCamp) return;
    setEditForm({
      public_title: activeDisplayCamp.public_title || '',
      internal_name: activeDisplayCamp.internal_name || '',
      camp_date: toDateInputValue(activeDisplayCamp.camp_date),
      starts_at: toTimeInputValue(activeDisplayCamp.starts_at) || '09:00',
      ends_at: toTimeInputValue(activeDisplayCamp.ends_at) || '16:00',
      venue: activeDisplayCamp.venue || '',
      venue_subtitle: activeDisplayCamp.venue_subtitle || '',
      description: activeDisplayCamp.description || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveCampDetails = async (e) => {
    e.preventDefault();
    if (!editForm) return;

    if (!editForm.public_title?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Title', text: 'Public camp title is required.' });
      return;
    }
    if (!editForm.camp_date) {
      Swal.fire({ icon: 'warning', title: 'Missing Date', text: 'Camp date is required.' });
      return;
    }
    if (!editForm.venue?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Venue', text: 'Venue is required.' });
      return;
    }
    if (!editForm.starts_at || !editForm.ends_at) {
      Swal.fire({ icon: 'warning', title: 'Missing Times', text: 'Start and end operating times are required.' });
      return;
    }
    if (editForm.ends_at <= editForm.starts_at) {
      Swal.fire({ icon: 'warning', title: 'Invalid Operating Hours', text: 'End time must be after start time.' });
      return;
    }

    setLoading(true);
    try {
      const res = await adminService.camps.update(effectiveCampId, {
        public_title: editForm.public_title.trim(),
        internal_name: editForm.internal_name?.trim() || editForm.public_title.trim(),
        camp_date: editForm.camp_date,
        starts_at: editForm.starts_at,
        ends_at: editForm.ends_at,
        venue: editForm.venue?.trim(),
        venue_subtitle: editForm.venue_subtitle?.trim() || null,
        description: editForm.description?.trim() || null
      });

      if (res.success) {
        setCampData(prev => ({
          ...prev,
          ...editForm,
          ...(res.data || {})
        }));
        await refreshCamps();
        notifyCampUpdated({ campId: effectiveCampId, action: 'update' });
        setEditModalOpen(false);
        Swal.fire({
          icon: 'success',
          title: 'Camp Updated',
          text: res.message || 'Camp details successfully saved.',
          confirmButtonColor: '#B91C1C'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: res.message || 'Failed to save camp details.'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'An unexpected error occurred while saving.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!activeDisplayCamp) {
    return <LoadingState message="Loading camp workspace..." />;
  }

  const campYear = activeDisplayCamp.camp_year;

  return (
    <div className="space-y-7 max-w-7xl mx-auto font-sans pb-12">
      {/* Eyebrow and Title Header matching reference 12 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#B91C1C] mb-1">
            MODULE 1 · CAMP MANAGEMENT
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            BDC {campYear}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatCampDate(activeDisplayCamp.camp_date)}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatOperatingHours(activeDisplayCamp.starts_at, activeDisplayCamp.ends_at)}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeDisplayCamp.venue}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <button
              type="button"
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Camp Details</span>
            </button>
          )}

          <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${
            isThisCampLive
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-slate-100 border border-slate-200 text-slate-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isThisCampLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{isThisCampLive ? 'Live (Public Website)' : 'Not live'}</span>
          </span>

          <button
            type="button"
            onClick={handleToggleRegistration}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeDisplayCamp.registration_open
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                : 'bg-rose-50 border border-rose-300 text-rose-800'
            }`}
          >
            {activeDisplayCamp.registration_open ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Registration Open</span>
              </>
            ) : (
              <>
                <X className="w-3.5 h-3.5 text-rose-600" />
                <span>Registration Closed</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Stat Cards: Total, Donated, Not Donated */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Registrations */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            TOTAL REGISTRATIONS
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {stats.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Donors registered for BDC {campYear}
          </div>
        </div>

        {/* Verified Donated */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-2xs bg-emerald-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            VERIFIED DONATED
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {stats.donated}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Units successfully collected
          </div>
        </div>

        {/* Not Donated */}
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 shadow-2xs bg-rose-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
            NOT DONATED
          </div>
          <div className="text-3xl font-extrabold text-rose-600 mt-2">
            {stats.notDonated}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Not yet donated or deferred
          </div>
        </div>
      </div>

      {/* Two Column Layout matching reference 12 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Public Website Visibility */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Public Website Visibility
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control what visitors see on the public website for this camp
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {/* Team Section */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-800">
                  Team Section
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Display committee members and coordinators on /team
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(visibility.team)}
                  onChange={() => handleToggleVisibility('team')}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B91C1C]" />
              </label>
            </div>

            {/* Sponsors Section */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-800">
                  Sponsors Section
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Show sponsor logos and partners on /supporters
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(visibility.sponsors)}
                  onChange={() => handleToggleVisibility('sponsors')}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B91C1C]" />
              </label>
            </div>

            {/* Registration Access */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-800">
                  Registration Access
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Allow new donors to submit registration on /register
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={Boolean(activeDisplayCamp.registration_open)}
                  onChange={handleToggleRegistration}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B91C1C]" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Camp Details & Specification */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Camp Specifications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configuration details and metadata for BDC {campYear}
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-slate-700">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-bold text-slate-500">Internal Reference</span>
              <span className="font-semibold text-slate-900">{activeDisplayCamp.internal_name}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-bold text-slate-500">Public Camp Title</span>
              <span className="font-semibold text-slate-900">{activeDisplayCamp.public_title}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-bold text-slate-500">Scheduled Date</span>
              <span className="font-semibold text-slate-900">{formatCampDate(activeDisplayCamp.camp_date)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-bold text-slate-500">Operating Hours</span>
              <span className="font-semibold text-slate-900">{formatOperatingHours(activeDisplayCamp.starts_at, activeDisplayCamp.ends_at)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="font-bold text-slate-500">Venue Facility</span>
              <span className="font-semibold text-slate-900 text-right max-w-xs">{activeDisplayCamp.venue}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="font-bold text-slate-500">Live Status</span>
              <span className={`font-bold ${isThisCampLive ? 'text-emerald-700' : 'text-slate-600'}`}>
                {isThisCampLive ? 'Live' : 'Not live'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Details Modal */}
      {editModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Camp Details (BDC {campYear})
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampDetails} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Public Title</label>
                <input
                  type="text"
                  value={editForm.public_title}
                  onChange={(e) => setEditForm({ ...editForm, public_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Reference Name</label>
                <input
                  type="text"
                  value={editForm.internal_name}
                  onChange={(e) => setEditForm({ ...editForm, internal_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Camp Date</label>
                  <input
                    type="date"
                    value={editForm.camp_date}
                    onChange={(e) => setEditForm({ ...editForm, camp_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={editForm.venue}
                    onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editForm.starts_at || '09:00'}
                    onChange={(e) => setEditForm({ ...editForm, starts_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={editForm.ends_at || '16:00'}
                    onChange={(e) => setEditForm({ ...editForm, ends_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 font-mono text-xs"
                    required
                  />
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">Operating Hours Preview:</span>
                <span className="font-bold text-slate-900">
                  {formatOperatingHours(editForm.starts_at, editForm.ends_at)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue Subtitle / Campus Location</label>
                <input
                  type="text"
                  value={editForm.venue_subtitle || ''}
                  onChange={(e) => setEditForm({ ...editForm, venue_subtitle: e.target.value })}
                  placeholder="e.g. Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
