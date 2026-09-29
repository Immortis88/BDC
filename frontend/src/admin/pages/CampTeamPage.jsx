import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import { adminService } from '../services/adminService.js';
import {
  Users,
  Plus,
  RefreshCw,
  Phone,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  Eye,
  EyeOff,
  User
} from 'lucide-react';
import Swal from 'sweetalert2';
import SortableCards from '../components/SortableCards.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { ImagePickerField } from '../components/ImagePickerModal.jsx';

const SECTIONS = [
  {
    key: 'CHIEF_COORDINATOR',
    label: 'CHIEF COORDINATOR',
    desc: 'Lead. Organise. Inspire. Driving the vision of BDC with dedication and compassion.'
  },
  {
    key: 'MEMBERS',
    label: 'MEMBERS',
    desc: 'The core team working behind the scenes to make every camp a success.'
  },
  {
    key: 'STUDENT_COORDINATORS',
    label: 'STUDENT COORDINATORS',
    desc: 'Student leaders who help in organising, coordinating and managing the ground activities.'
  },

];

export default function CampTeamPage() {
  const { campId: paramCampId } = useParams();
  const { isSuperAdmin, hasPermission } = useAdminAuth();
  const { selectedCampId, selectedCamp } = useAdminCamp();

  const effectiveCampId = Number(paramCampId) || Number(selectedCampId) || 2026;
  const campYear = selectedCamp?.camp_year || effectiveCampId || 2026;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cardsPerRow, setCardsPerRow] = useState(5);
  const [saving, setSaving] = useState(false);
  const [modalMember, setModalMember] = useState(null); // { mode: 'create'|'edit', member }

  const loadVersion = useRef(0);
  const currentCamp = useRef(effectiveCampId);
  currentCamp.current = effectiveCampId;
  const loadTeam = async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    try {
      const res = await adminService.team.getByCamp(effectiveCampId);
      if (res.success && version === loadVersion.current && currentCamp.current === effectiveCampId) {
        setMembers(res.data);
      }
    } finally {
      if (version === loadVersion.current && currentCamp.current === effectiveCampId) setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [effectiveCampId]);

  const handleDeleteMember = async (id) => {
    const confirm = await Swal.fire({
      title: 'Remove Team Member?',
      text: 'This person will no longer appear on the public team page.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#981B24',
      confirmButtonText: 'Yes, remove'
    });

    if (confirm.isConfirmed) {
      const res = await adminService.team.delete(effectiveCampId, id);
      if (res.success) {
        await loadTeam();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Team member removed.',
          showConfirmButton: false,
          timer: 1500
        });
      }
    }
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!modalMember?.member?.full_name?.trim()) return;

    const payload = {
      full_name: modalMember.member.full_name.trim(),
      role_label: (modalMember.member.role_label || '').trim(),
      phone: modalMember.member.phone?.trim() || '',
      photo_url: modalMember.member.photo_url?.trim() || '',
      photo_asset_id: modalMember.member.photo_asset_id || null,
      group_key: modalMember.member.group_key || 'MEMBERS',
      show_phone_publicly: Boolean(modalMember.member.show_phone_publicly)
    };

    if (saving) return;
    setSaving(true);
    try {
      const res = modalMember.mode === 'edit'
        ? await adminService.team.update(effectiveCampId, modalMember.member.id, payload)
        : await adminService.team.create(effectiveCampId, payload);
      if (!res.success) throw new Error(res.message || 'Could not save this team member.');
      setModalMember(null);
      await loadTeam();
      Swal.fire({ toast: true, position: 'top-end', icon: 'success',
        title: 'Team member saved successfully.', showConfirmButton: false, timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Save failed', text: error.message || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Team Roster..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-12">
      {/* Top Header Card matching reference 09 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#B91C1C] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold uppercase text-slate-900 tracking-tight">
              TEAM MANAGEMENT
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize faculty coordinators, members, and student coordinators for BDC {campYear}.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="font-semibold">Columns:</span>
            {[3, 4, 5, 6].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setCardsPerRow(num)}
                className={`w-6 h-6 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                  cardsPerRow === num
                    ? 'bg-[#B91C1C] text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadTeam}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Refresh Roster"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setModalMember({
              mode: 'create',
              member: {
                full_name: '',
                role_label: '',
                phone: '',
                photo_url: '',
                group_key: 'MEMBERS',
                show_phone_publicly: false
              }
            })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Sections rendering matching the 4 public website tiers */}
      {SECTIONS.map((sec) => {
        const groupMembers = members.filter(m => m.group_key === sec.key);

        return (
          <div key={sec.key} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  {sec.label} ({groupMembers.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {sec.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalMember({
                  mode: 'create',
                  member: {
                    full_name: '',
                    role_label: '',
                    phone: '',
                    photo_url: '',
                    group_key: sec.key,
                    show_phone_publicly: false
                  }
                })}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#B91C1C] hover:text-[#991B1B] cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add to {sec.label}</span>
              </button>
            </div>

            {/* Grid matching cardsPerRow */}
            <SortableCards key={`${effectiveCampId}-${sec.key}`} items={groupMembers} label={sec.label}
              disabled={!hasPermission('camp.team', effectiveCampId)}
              onChange={next => setMembers(current => [...current.filter(m => m.group_key !== sec.key), ...next])}
              onSave={(orderedIds, previousIds) => adminService.team.reorder(effectiveCampId, orderedIds, { groupKey: sec.key, previousIds })}
              className={`grid gap-4 ${
              cardsPerRow === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
              cardsPerRow === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
              cardsPerRow === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' :
              'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
            }`} renderItem={(member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition flex flex-col items-center text-center relative group"
                >
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-rose-50 border-2 border-[#981B24]/20 mb-3 flex items-center justify-center shrink-0">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <User className="w-9 h-9 text-[#C9A8A0]" strokeWidth={1.5} />
                    )}
                  </div>

                  {/* Name & Role */}
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 mb-0.5">
                    {member.full_name}
                  </h3>
                  {member.role_label ? (
                    <p className="text-[11px] font-semibold text-[#B91C1C] line-clamp-1 mb-1">
                      {member.role_label}
                    </p>
                  ) : null}

                  {/* Phone / Details */}
                  {member.phone && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {/* Actions overlay / footer */}
                  <div className="mt-3 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalMember({ mode: 'edit', member: { ...member } })}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                      title="Edit member"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )} />

              {groupMembers.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                  No members assigned to {sec.label} yet.
                </div>
              )}
          </div>
        );
      })}

      {/* Add / Edit Member Modal */}
      {modalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalMember.mode === 'create' ? 'Add Team Member' : 'Edit Team Member'}
              </h3>
              <button
                type="button"
                onClick={() => setModalMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={modalMember.member.full_name}
                  onChange={(e) => setModalMember({
                    ...modalMember,
                    member: { ...modalMember.member, full_name: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Roster Section Group *</label>
                <select
                  value={modalMember.member.group_key}
                  onChange={(e) => setModalMember({
                    ...modalMember,
                    member: { ...modalMember.member, group_key: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  {SECTIONS.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Title / Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Coordinator, Student Coordinator, Member"
                  value={modalMember.member.role_label}
                  onChange={(e) => setModalMember({
                    ...modalMember,
                    member: { ...modalMember.member, role_label: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+91 141 350 0000"
                  value={modalMember.member.phone || ''}
                  onChange={(e) => setModalMember({
                    ...modalMember,
                    member: { ...modalMember.member, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(modalMember.member.show_phone_publicly)} onChange={e => setModalMember({ ...modalMember, member: { ...modalMember.member, show_phone_publicly: e.target.checked } })} />
                Show phone number on Team page
              </label>
              <ImagePickerField
                label="Member Portrait Photo"
                value={modalMember.member.photo_url}
                onChange={(url, assetId) => setModalMember({
                  ...modalMember,
                  member: {
                    ...modalMember.member,
                    photo_url: url,
                    photo_asset_id: assetId
                  }
                })}
                onRemove={() => setModalMember({
                  ...modalMember,
                  member: {
                    ...modalMember.member,
                    photo_url: '',
                    photo_asset_id: null
                  }
                })}
                kind="TEAM"
                campId={effectiveCampId}
                cropShape="round"
                aspectRatio={1}
                recommendation="Square 1:1 portrait (min 400x400px). Face will be centered in circular mask."
              />

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMember(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
