import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import { adminService } from '../services/adminService.js';
import { queryClient } from '../../queryClient.js';
import { notifyCampUpdated } from '../../utils/campEvents.js';
import {
  Calendar,
  Clock,
  Droplet,
  Plus,
  Search,
  MapPin,
  Edit2,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  formatCampDate,
  formatOperatingHours,
  toDateInputValue,
  toTimeInputValue
} from '../../utils/dateUtils.js';

export default function CampsAdminPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, hasPermission, liveCampId, setLiveCampId } = useAdminAuth();
  const { camps, refreshCamps, selectCamp } = useAdminCamp();

  const [searchYear, setSearchYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalCamp, setEditModalCamp] = useState(null);

  const canSwitchLive = isSuperAdmin || hasPermission('site.switch_live_camp');

  // Find active live camp (if any active on public website)
  const liveCamp = useMemo(() => {
    if (!liveCampId) return null;
    return camps.find(c => c.id === Number(liveCampId)) || null;
  }, [camps, liveCampId]);

  // Other camps (all camps except the live one, or all camps if none live)
  const otherCamps = useMemo(() => {
    const list = liveCamp ? camps.filter(c => c.id !== liveCamp.id) : camps;
    if (!searchYear.trim()) return list;
    return list.filter(c =>
      c.camp_year?.toString().includes(searchYear.trim()) ||
      c.public_title?.toLowerCase().includes(searchYear.toLowerCase()) ||
      c.internal_name?.toLowerCase().includes(searchYear.toLowerCase())
    );
  }, [camps, liveCamp, searchYear]);

  // Form state for new camp
  const [newCampForm, setNewCampForm] = useState({
    camp_year: new Date().getFullYear() + 1,
    internal_name: '',
    public_title: '',
    description: '',
    camp_date: '',
    starts_at: '09:00',
    ends_at: '16:00',
    venue: 'Central Amphitheatre & Medical Block, SKIT Campus, Jaipur',
    venue_subtitle: 'Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017'
  });

  const handleEnterWorkspace = (campId) => {
    selectCamp(campId);
    navigate(`/admin/camps/${campId}/overview`);
  };

  const openCreateModal = () => {
    const nextYear = new Date().getFullYear() + 1;
    setNewCampForm({
      camp_year: nextYear,
      internal_name: `BDC ${nextYear}`,
      public_title: `${nextYear} Blood Donation Camp`,
      description: '',
      camp_date: `${nextYear}-10-15`,
      starts_at: '09:00',
      ends_at: '16:00',
      venue: 'Central Amphitheatre & Medical Block, SKIT Campus, Jaipur',
      venue_subtitle: 'Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017'
    });
    setCreateModalOpen(true);
  };

  const openEditModal = (camp) => {
    setEditModalCamp({
      id: camp.id,
      camp_year: camp.camp_year,
      public_title: camp.public_title || '',
      internal_name: camp.internal_name || '',
      camp_date: toDateInputValue(camp.camp_date),
      starts_at: toTimeInputValue(camp.starts_at) || '09:00',
      ends_at: toTimeInputValue(camp.ends_at) || '16:00',
      venue: camp.venue || '',
      venue_subtitle: camp.venue_subtitle || '',
      description: camp.description || '',
      registration_open: Boolean(camp.registration_open)
    });
  };

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    const year = Number(newCampForm.camp_year);
    if (!year || year < 1990 || year > 2199) {
      Swal.fire({ icon: 'warning', title: 'Invalid Year', text: 'Please enter a valid 4-digit year.' });
      return;
    }
    if (!newCampForm.public_title?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Title', text: 'Public camp title is required.' });
      return;
    }
    if (!newCampForm.camp_date) {
      Swal.fire({ icon: 'warning', title: 'Missing Date', text: 'Camp date is required.' });
      return;
    }
    if (!newCampForm.venue?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Venue', text: 'Venue location is required.' });
      return;
    }
    if (newCampForm.ends_at <= newCampForm.starts_at) {
      Swal.fire({ icon: 'warning', title: 'Invalid Operating Hours', text: 'End time must be later than start time.' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        camp_year: year,
        internal_name: newCampForm.internal_name?.trim() || `BDC ${year}`,
        public_title: newCampForm.public_title.trim(),
        description: newCampForm.description?.trim() || null,
        camp_date: newCampForm.camp_date,
        starts_at: newCampForm.starts_at,
        ends_at: newCampForm.ends_at,
        venue: newCampForm.venue.trim(),
        venue_subtitle: newCampForm.venue_subtitle?.trim() || null
      };

      const res = await adminService.camps.create(payload);

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Camp Created',
          text: res.message || `Camp BDC ${year} created successfully.`,
          confirmButtonColor: '#B91C1C'
        });
        setCreateModalOpen(false);
        await refreshCamps();
        notifyCampUpdated({ action: 'create' });
      } else {
        Swal.fire({ icon: 'error', title: 'Failed to Create Camp', text: res.message || 'Could not create camp.' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCamp = async (e) => {
    e.preventDefault();
    if (!editModalCamp) return;

    if (!editModalCamp.public_title?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Title', text: 'Public camp title is required.' });
      return;
    }
    if (!editModalCamp.camp_date) {
      Swal.fire({ icon: 'warning', title: 'Missing Date', text: 'Camp date is required.' });
      return;
    }
    if (!editModalCamp.venue?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Venue', text: 'Venue location is required.' });
      return;
    }
    if (!editModalCamp.starts_at || !editModalCamp.ends_at) {
      Swal.fire({ icon: 'warning', title: 'Missing Time', text: 'Start and end operating times are required.' });
      return;
    }
    if (editModalCamp.ends_at <= editModalCamp.starts_at) {
      Swal.fire({ icon: 'warning', title: 'Invalid Operating Hours', text: 'End time must be later than start time.' });
      return;
    }

    setLoading(true);
    try {
      const res = await adminService.camps.update(editModalCamp.id, {
        public_title: editModalCamp.public_title.trim(),
        internal_name: editModalCamp.internal_name?.trim() || editModalCamp.public_title.trim(),
        camp_date: editModalCamp.camp_date,
        starts_at: editModalCamp.starts_at,
        ends_at: editModalCamp.ends_at,
        venue: editModalCamp.venue?.trim(),
        venue_subtitle: editModalCamp.venue_subtitle?.trim() || null,
        description: editModalCamp.description?.trim() || null
      });

      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Camp Updated',
          text: res.message || 'Camp details successfully saved.',
          confirmButtonColor: '#B91C1C'
        });
        const updatedId = editModalCamp.id;
        setEditModalCamp(null);
        await refreshCamps();
        notifyCampUpdated({ campId: updatedId, action: 'update' });
      } else {
        Swal.fire({ icon: 'error', title: 'Update Failed', text: res.message || 'Failed to update camp.' });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegistration = async (camp, currentValue) => {
    const nextVal = !currentValue;
    const res = await adminService.camps.update(camp.id, { registration_open: nextVal });
    if (res.success) {
      await refreshCamps();
      notifyCampUpdated({ campId: camp.id, action: 'registration' });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Registration for BDC ${camp.camp_year} is now ${nextVal ? 'Open' : 'Closed'}`,
        showConfirmButton: false,
        timer: 1800
      });
    }
  };

  const handleDeleteCamp = async (camp) => {
    if (!isSuperAdmin) return;
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: `Archive BDC ${camp.camp_year}?`,
      text: 'The camp will disappear from active lists, but registrations, photos, team, sponsors, and other records will remain stored. A new camp can reuse the same details safely.',
      showCancelButton: true,
      confirmButtonText: 'Archive Camp',
      confirmButtonColor: '#B91C1C',
      cancelButtonText: 'Keep Camp'
    });
    if (!confirmation.isConfirmed) return;
    setLoading(true);
    try {
      const res = await adminService.camps.delete(camp.id);
      if (!res.success) throw new Error(res.message || 'Could not archive camp.');
      await refreshCamps();
      notifyCampUpdated({ campId: camp.id, action: 'archive' });
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Camp archived safely.', showConfirmButton: false, timer: 1800 });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Archive Failed', text: err.message || 'Could not archive camp.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLive = async (camp) => {
    if (!canSwitchLive) {
      Swal.fire({
        icon: 'warning',
        title: 'Permission Restricted',
        text: 'Only Super Administrators or accounts with live-switch permission can change which camp is live on the public website.',
        confirmButtonColor: '#B91C1C'
      });
      return;
    }

    const isCurrentLive = Number(camp.id) === Number(liveCampId);

    if (isCurrentLive) {
      const result = await Swal.fire({
        title: 'Turn Off Live Camp?',
        text: `Turning '${camp.public_title || camp.internal_name}' OFF will leave NO live camp on the public website. The site will display that no active campaign is currently listed.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#B91C1C',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Yes, Turn OFF Live Camp'
      });

      if (!result.isConfirmed) return;

      setLoading(true);
      try {
        const res = await adminService.camps.clearLiveCamp();
        if (res.success) {
          setLiveCampId(null);
          await refreshCamps();
          notifyCampUpdated({ action: 'clear-live' });
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Live Camp Turned OFF',
            text: 'No camp is currently active on the public website.',
            showConfirmButton: false,
            timer: 2000
          });
        }
      } finally {
        setLoading(false);
      }
    } else {
      const outgoingLiveCamp = camps.find(c => c.id === Number(liveCampId));
      const outgoingNotice = outgoingLiveCamp
        ? `Switching to this camp will turn '${outgoingLiveCamp.public_title || outgoingLiveCamp.internal_name}' OFF and safely close its registration.`
        : `This camp will become the single active campaign on the public website.`;

      const result = await Swal.fire({
        title: `Make BDC ${camp.camp_year} Live?`,
        text: `${outgoingNotice} (Registration for BDC ${camp.camp_year} will remain closed until you deliberately open it.)`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Yes, Make Live'
      });

      if (!result.isConfirmed) return;

      setLoading(true);
      try {
        const res = await adminService.camps.setLiveCamp(camp.id);
        if (res.success) {
          setLiveCampId(camp.id);
          await refreshCamps();
          notifyCampUpdated({ campId: camp.id, action: 'set-live' });
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `BDC ${camp.camp_year} is now Live`,
            showConfirmButton: false,
            timer: 2000
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Camp Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase text-slate-900 tracking-tight">
            CAMP MANAGEMENT
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Select any camp card to enter its dedicated administration workspace.
          </p>
        </div>

        {/* Controls: Removed Cards/Table switch and Refresh button per reference */}
        {isSuperAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shadow-md shadow-red-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE NEW CAMP</span>
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: CURRENT LIVE CAMP (PUBLIC WEBSITE) */}
      {liveCamp ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CURRENT LIVE CAMP (PUBLIC WEBSITE)</span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Supplies current camp content displayed on the public website
            </span>
          </div>

          {/* Prominent Horizontal Card */}
          <div
            onClick={() => handleEnterWorkspace(liveCamp.id)}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-all hover:border-slate-300 cursor-pointer group"
          >
            {/* Left Cover Image Container */}
            <div className="md:col-span-5 bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-6 text-white flex flex-col justify-between relative min-h-[220px]">
              {/* Only Live Status Badge */}
              <div className="flex items-center gap-2 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live</span>
                </span>
              </div>

              {/* Cover Graphic / Clean Centered Blood Drop Symbol */}
              <div className="my-auto text-center py-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner group-hover:scale-105 transition-transform duration-300 mb-2.5">
                  <Droplet className="w-7 h-7 fill-red-500/30 text-red-500" />
                </div>
                <div className="text-xs font-bold tracking-wider uppercase text-slate-200">
                  {liveCamp.public_title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  BDC {liveCamp.camp_year} • Active Campaign
                </div>
              </div>

              <div className="text-[11px] text-slate-400 z-10">
                Live Public Camp
              </div>
            </div>

            {/* Right Information Container */}
            <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-5" onClick={(e) => e.stopPropagation()}>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono mb-1">
                  YEAR: {liveCamp.camp_year} • STATUS: LIVE
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  BDC {liveCamp.camp_year}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {liveCamp.public_title}
                </p>

                {/* Date, Operating Hours & Venue */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    <span className="truncate"><strong>Date:</strong> {formatCampDate(liveCamp.camp_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    <span className="truncate"><strong>Hours:</strong> {formatOperatingHours(liveCamp.starts_at, liveCamp.ends_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 sm:col-span-2 lg:col-span-1">
                    <MapPin className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    <span className="truncate" title={liveCamp.venue}><strong>Venue:</strong> {liveCamp.venue}</span>
                  </div>
                </div>
              </div>

              {/* Status Toggles & Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Working Live and Registration Toggles */}
                <div className="flex items-center gap-5 text-xs font-semibold text-slate-700">
                  {/* Live Toggle */}
                  <div className="flex items-center gap-2">
                    <span>Live:</span>
                    <label
                      className={`relative inline-flex items-center ${canSwitchLive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                      title={canSwitchLive ? 'Toggle Live status on public website' : 'Requires live-switch permission'}
                    >
                      <input
                        type="checkbox"
                        checked={true}
                        disabled={!canSwitchLive}
                        onChange={() => handleToggleLive(liveCamp)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live
                    </span>
                  </div>

                  {/* Registration Toggle */}
                  <div className="flex items-center gap-2">
                    <span>Registration:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(liveCamp.registration_open)}
                        onChange={() => handleToggleRegistration(liveCamp, liveCamp.registration_open)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#B91C1C]" />
                    </label>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      liveCamp.registration_open
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {liveCamp.registration_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(liveCamp);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnterWorkspace(liveCamp.id);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold tracking-wide transition-all shadow-md cursor-pointer"
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Camp Live Banner */
        <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                No Camp is Currently Live on the Public Website
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                The public website indicates that no active campaign is listed. Turn Live ON on any camp below to publish it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: OTHER CAMPS (OR ALL CAMPS IF NONE LIVE) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            {liveCamp ? `PREVIOUS & OTHER CAMPS (${otherCamps.length})` : `ALL CAMPS (${otherCamps.length})`}
          </h2>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              placeholder="Filter year..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
            />
          </div>
        </div>

        {/* Camp Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {otherCamps.map((camp) => {
            const isLive = camp.id === Number(liveCampId);

            return (
              <div
                key={camp.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Camp Card Header: Only Live / Not live status */}
                <div className="p-5 pb-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#0B132B] text-white">
                      BDC {camp.camp_year}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isLive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isLive ? '● Live' : 'Not live'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    BDC {camp.camp_year}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {camp.public_title}
                  </p>
                </div>

                {/* Details */}
                <div className="p-5 py-4 space-y-2.5 text-xs text-slate-600 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{formatCampDate(camp.camp_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 truncate">{formatOperatingHours(camp.starts_at, camp.ends_at)}</span>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1 text-slate-600" title={camp.venue}>{camp.venue}</span>
                  </div>

                  {/* Working Controls on card: Live and Registration toggles */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    {/* Live Website Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">Live:</span>
                      <div className="flex items-center gap-2">
                        <label
                          className={`relative inline-flex items-center ${canSwitchLive ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                          title={canSwitchLive ? 'Turn Live ON or OFF for this camp' : 'Requires live-switch permission'}
                        >
                          <input
                            type="checkbox"
                            checked={isLive}
                            disabled={!canSwitchLive}
                            onChange={() => handleToggleLive(camp)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
                        </label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isLive ? 'Live' : 'Not live'}
                        </span>
                      </div>
                    </div>

                    {/* Registration Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">Registration:</span>
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(camp.registration_open)}
                            onChange={() => handleToggleRegistration(camp, camp.registration_open)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#B91C1C]" />
                        </label>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          camp.registration_open
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {camp.registration_open ? 'Open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(camp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCamp(camp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-red-700 transition-colors cursor-pointer"
                      title="Archive camp (Super Admin only)"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleEnterWorkspace(camp.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B132B] hover:bg-[#1E293B] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
          {otherCamps.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              No camps found matching filter.
            </div>
          )}
        </div>
      </div>

      {/* Edit Camp Modal */}
      {editModalCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Camp {editModalCamp.camp_year}
              </h3>
              <button
                type="button"
                onClick={() => setEditModalCamp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCamp} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Public Camp Title</label>
                <input
                  type="text"
                  value={editModalCamp.public_title}
                  onChange={(e) => setEditModalCamp({ ...editModalCamp, public_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Reference Name</label>
                <input
                  type="text"
                  value={editModalCamp.internal_name}
                  onChange={(e) => setEditModalCamp({ ...editModalCamp, internal_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Camp Date</label>
                  <input
                    type="date"
                    value={editModalCamp.camp_date}
                    onChange={(e) => setEditModalCamp({ ...editModalCamp, camp_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Venue Name</label>
                  <input
                    type="text"
                    value={editModalCamp.venue}
                    onChange={(e) => setEditModalCamp({ ...editModalCamp, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time (Operating Hours) *</label>
                  <input
                    type="time"
                    value={editModalCamp.starts_at || '09:00'}
                    onChange={(e) => setEditModalCamp({ ...editModalCamp, starts_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time (Operating Hours) *</label>
                  <input
                    type="time"
                    value={editModalCamp.ends_at || '16:00'}
                    onChange={(e) => setEditModalCamp({ ...editModalCamp, ends_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                <span>Operating hours preview:</span>
                <span className="font-semibold text-slate-800">
                  {formatOperatingHours(editModalCamp.starts_at, editModalCamp.ends_at)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue Subtitle / Campus Location</label>
                <input
                  type="text"
                  value={editModalCamp.venue_subtitle || ''}
                  onChange={(e) => setEditModalCamp({ ...editModalCamp, venue_subtitle: e.target.value })}
                  placeholder="e.g. Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalCamp(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Camp Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Create New Blood Donation Camp
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamp} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Camp Year (YYYY) *</label>
                  <input
                    type="number"
                    min="1990"
                    max="2199"
                    value={newCampForm.camp_year}
                    onChange={(e) => setNewCampForm({ ...newCampForm, camp_year: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Camp Date *</label>
                  <input
                    type="date"
                    value={newCampForm.camp_date}
                    onChange={(e) => setNewCampForm({ ...newCampForm, camp_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Public Camp Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 25th Blood Donation Camp 2027"
                  value={newCampForm.public_title}
                  onChange={(e) => setNewCampForm({ ...newCampForm, public_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time (Operating Hours) *</label>
                  <input
                    type="time"
                    value={newCampForm.starts_at}
                    onChange={(e) => setNewCampForm({ ...newCampForm, starts_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time (Operating Hours) *</label>
                  <input
                    type="time"
                    value={newCampForm.ends_at}
                    onChange={(e) => setNewCampForm({ ...newCampForm, ends_at: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                    required
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                <span>Operating hours preview:</span>
                <span className="font-semibold text-slate-800">
                  {formatOperatingHours(newCampForm.starts_at, newCampForm.ends_at)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue Location *</label>
                <input
                  type="text"
                  value={newCampForm.venue}
                  onChange={(e) => setNewCampForm({ ...newCampForm, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Venue Subtitle / Campus Location</label>
                <input
                  type="text"
                  value={newCampForm.venue_subtitle}
                  onChange={(e) => setNewCampForm({ ...newCampForm, venue_subtitle: e.target.value })}
                  placeholder="e.g. Ramnagaria, Jagatpura, Jaipur, Rajasthan 302017"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold shadow-xs cursor-pointer"
                >
                  Create Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
