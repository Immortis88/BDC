import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import { adminService } from '../services/adminService.js';
import {
  Building2,
  Heart,
  Award,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon
} from 'lucide-react';
import Swal from 'sweetalert2';
import SortableCards from '../components/SortableCards.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { ImagePickerField } from '../components/ImagePickerModal.jsx';

export default function CampSponsorsPage() {
  const { campId: paramCampId } = useParams();
  const { isSuperAdmin, hasPermission } = useAdminAuth();
  const { selectedCampId, selectedCamp } = useAdminCamp();

  const effectiveCampId = Number(paramCampId) || Number(selectedCampId) || 2026;
  const campYear = selectedCamp?.camp_year || effectiveCampId || 2026;

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalSponsor, setModalSponsor] = useState(null); // { mode: 'create'|'edit', sectionId, sponsor }
  const [modalSection, setModalSection] = useState(null); // { mode: 'create'|'edit', section: { id, heading, description } }
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState(false);

  const loadVersion = useRef(0);
  const currentCamp = useRef(effectiveCampId);
  currentCamp.current = effectiveCampId;
  const loadSponsors = async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    try {
      const res = await adminService.sponsors.getByCamp(effectiveCampId);
      if (res.success && version === loadVersion.current && currentCamp.current === effectiveCampId) {
        setSections(res.data);
      }
    } finally {
      if (version === loadVersion.current && currentCamp.current === effectiveCampId) setLoading(false);
    }
  };

  useEffect(() => {
    loadSponsors();
  }, [effectiveCampId]);

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!modalSection?.section?.heading?.trim()) return;

    setSavingSection(true);
    try {
      const payload = {
        heading: modalSection.section.heading.trim(),
        description: modalSection.section.description?.trim() || ''
      };
      const res = modalSection.mode === 'edit'
        ? await adminService.sponsors.updateSection(effectiveCampId, modalSection.section.id, payload)
        : await adminService.sponsors.createSection(effectiveCampId, payload);

      if (!res.success) throw new Error(res.message || 'Could not save section.');
      setModalSection(null);
      await loadSponsors();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: modalSection.mode === 'edit' ? 'Section updated.' : 'Section created.',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Save failed', text: err.message || 'Please try again.' });
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (section) => {
    const hasSponsors = section.sponsors && section.sponsors.length > 0;
    const otherSections = sections.filter(s => s.id !== section.id);

    if (hasSponsors && otherSections.length > 0) {
      const result = await Swal.fire({
        title: `Delete Section "${section.heading}"?`,
        html: `<p class="text-xs text-slate-600 mb-2">This section has <b>${section.sponsors.length}</b> sponsor(s). Would you like to reassign them to another section or delete them with the section?</p>`,
        icon: 'warning',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        denyButtonColor: '#981B24',
        confirmButtonText: 'Reassign Sponsors',
        denyButtonText: 'Delete Section & Sponsors',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        // Reassign
        const optionsHtml = otherSections.map(s => `<option value="${s.id}">${s.heading}</option>`).join('');
        const { value: targetSectionId } = await Swal.fire({
          title: 'Select Target Section',
          html: `
            <p class="text-xs text-slate-500 mb-3">Move all ${section.sponsors.length} sponsors into:</p>
            <select id="swal-target-section" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs">
              ${optionsHtml}
            </select>
          `,
          preConfirm: () => {
            const el = document.getElementById('swal-target-section');
            return el ? el.value : null;
          },
          showCancelButton: true,
          confirmButtonColor: '#981B24',
          confirmButtonText: 'Reassign & Delete'
        });

        if (targetSectionId) {
          try {
            const res = await adminService.sponsors.deleteSection(effectiveCampId, section.id, { reassign_to_section_id: Number(targetSectionId) });
            if (!res.success) throw new Error(res.message || 'Could not delete section.');
            await loadSponsors();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Section removed and sponsors reassigned.', showConfirmButton: false, timer: 1500 });
          } catch (err) {
            Swal.fire({ icon: 'error', title: 'Delete failed', text: err.message || 'Could not delete section.' });
          }
        }
      } else if (result.isDenied) {
        // Delete both section and its sponsors
        try {
          const res = await adminService.sponsors.deleteSection(effectiveCampId, section.id);
          if (!res.success) throw new Error(res.message || 'Could not delete section.');
          await loadSponsors();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Section and sponsors removed.', showConfirmButton: false, timer: 1500 });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Delete failed', text: err.message || 'Could not delete section.' });
        }
      }
    } else {
      const confirm = await Swal.fire({
        title: `Delete Section "${section.heading}"?`,
        text: hasSponsors ? 'All sponsors in this section will also be removed.' : 'This empty section will be removed.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#981B24',
        confirmButtonText: 'Yes, delete'
      });

      if (confirm.isConfirmed) {
        try {
          const res = await adminService.sponsors.deleteSection(effectiveCampId, section.id);
          if (!res.success) throw new Error(res.message || 'Could not delete section.');
          await loadSponsors();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Section removed.', showConfirmButton: false, timer: 1500 });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Delete failed', text: err.message || 'Could not delete section.' });
        }
      }
    }
  };

  const handleDeleteSponsor = async (sponsorId) => {
    const confirm = await Swal.fire({
      title: 'Remove Sponsor?',
      text: 'This sponsor will no longer appear on the public supporters page.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#981B24',
      confirmButtonText: 'Yes, remove'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await adminService.sponsors.deleteSponsor(effectiveCampId, sponsorId);
        if (res.success) {
          await loadSponsors();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Sponsor removed.',
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          Swal.fire({ icon: 'error', title: 'Delete failed', text: res.message || 'Could not remove sponsor.' });
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Delete failed', text: err.message || 'Could not remove sponsor.' });
      }
    }
  };

  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    if (!modalSponsor?.sponsor?.name?.trim()) return;

    const payload = {
      ...modalSponsor.sponsor,
      section_id: modalSponsor.sectionId,
      name: modalSponsor.sponsor.name.trim(),
      tagline: modalSponsor.sponsor.tagline?.trim() || '',
      logo_url: modalSponsor.sponsor.logo_url?.trim() || '',
      website_url: modalSponsor.sponsor.website_url?.trim() || ''
    };

    if (saving) return;
    setSaving(true);
    try {
      const res = await adminService.sponsors.saveSponsor(effectiveCampId, modalSponsor.sectionId, payload);
      if (!res.success) throw new Error(res.message || 'Could not save sponsor.');
      setModalSponsor(null);
      await loadSponsors();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Sponsor saved successfully.',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Save failed', text: error.message || 'Could not save sponsor.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Partners & Sponsors..." />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-12">
      {/* Top Header Card matching reference 11 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#B91C1C] shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold uppercase text-slate-900 tracking-tight">
              PARTNERS &amp; SPONSORS MANAGEMENT
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage Title Partners, Main Sponsors, Supporting Sponsors, and Community Partners for BDC {campYear}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadSponsors}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Refresh Sponsors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setModalSection({
              mode: 'create',
              section: { heading: '', description: '' }
            })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Sections rendering */}
      <SortableCards key={effectiveCampId} items={sections} label="sponsor sections" disabled={!hasPermission('camp.sponsors', effectiveCampId)}
        onChange={setSections} className="space-y-8"
        onSave={(orderedIds, previousIds) => adminService.sponsors.reorderSections(effectiveCampId, orderedIds, { previousIds })}
        renderItem={(section) => (
        <div key={section.id} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-2 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  {section.heading} ({section.sponsors?.length || 0})
                </h2>
                <button
                  type="button"
                  onClick={() => setModalSection({
                    mode: 'edit',
                    section: { id: section.id, heading: section.heading, description: section.description }
                  })}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Edit Section Details"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSection(section)}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  title="Delete Section"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {section.description && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {section.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setModalSponsor({
                mode: 'create',
                sectionId: section.id,
                sponsor: {
                  name: '',
                  tagline: '',
                  logo_url: '',
                  website_url: ''
                }
              })}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#B91C1C] hover:text-[#991B1B] cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add to {section.heading}</span>
            </button>
          </div>

          {/* Grid of sponsors */}
          <SortableCards items={section.sponsors || []} label={`${section.heading} sponsors`} disabled={!hasPermission('camp.sponsors', effectiveCampId)}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            onChange={next => setSections(current => current.map(s => s.id === section.id ? { ...s, sponsors: next } : s))}
            onSave={(orderedIds, previousIds) => adminService.sponsors.reorderSponsors(effectiveCampId, orderedIds, { sectionId: Number(section.id), previousIds })}
            renderItem={(sponsor) => (
              <div
                key={sponsor.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  {/* Logo Preview */}
                  <div className="h-16 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center p-2 mb-3">
                    {sponsor.logo_url ? (
                      <img
                        src={sponsor.logo_url}
                        alt={sponsor.name}
                        className="max-h-12 max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {sponsor.name}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                    {sponsor.name}
                  </h3>
                  {sponsor.tagline && (
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-1 italic">
                      "{sponsor.tagline}"
                    </p>
                  )}
                </div>

                {/* Actions overlay / footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {sponsor.website_url ? (
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-[#B91C1C] flex items-center gap-1 font-medium truncate max-w-[130px]"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">Website</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">Partner</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModalSponsor({
                        mode: 'edit',
                        sectionId: section.id,
                        sponsor: { ...sponsor }
                      })}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                      title="Edit Sponsor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSponsor(sponsor.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete Sponsor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )} />

            {(!section.sponsors || section.sponsors.length === 0) && (
              <div className="col-span-full py-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No sponsors listed under {section.heading}.
              </div>
            )}
        </div>
      )} />

      {/* Add / Edit Sponsor Modal */}
      {modalSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalSponsor.mode === 'create' ? 'Add Partner / Sponsor' : 'Edit Partner Details'}
              </h3>
              <button
                type="button"
                onClick={() => setModalSponsor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSponsor} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sponsor Section *</label>
                <select
                  value={modalSponsor.sectionId}
                  onChange={(e) => setModalSponsor({
                    ...modalSponsor,
                    sectionId: Number(e.target.value)
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                >
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.heading}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Organization / Partner Name *</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SMS Hospital Jaipur"
                  value={modalSponsor.sponsor.name}
                  onChange={(e) => setModalSponsor({
                    ...modalSponsor,
                    sponsor: { ...modalSponsor.sponsor, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Partner Tagline (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. We understand your world"
                  value={modalSponsor.sponsor.tagline || ''}
                  onChange={(e) => setModalSponsor({
                    ...modalSponsor,
                    sponsor: { ...modalSponsor.sponsor, tagline: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <ImagePickerField
                label="Partner / Sponsor Logo"
                value={modalSponsor.sponsor.logo_url}
                onChange={(url, assetId) => setModalSponsor({
                  ...modalSponsor,
                  sponsor: {
                    ...modalSponsor.sponsor,
                    logo_url: url,
                    logo_asset_id: assetId
                  }
                })}
                onRemove={() => setModalSponsor({
                  ...modalSponsor,
                  sponsor: {
                    ...modalSponsor.sponsor,
                    logo_url: '',
                    logo_asset_id: null
                  }
                })}
                kind="SPONSOR"
                campId={effectiveCampId}
                isLogo={true}
                recommendation="Clean logo with transparent background (PNG or WebP recommended). Full fit preserved."
              />

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={modalSponsor.sponsor.website_url || ''}
                  onChange={(e) => setModalSponsor({
                    ...modalSponsor,
                    sponsor: { ...modalSponsor.sponsor, website_url: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalSponsor(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Section Modal */}
      {modalSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modalSection.mode === 'create' ? 'Add Sponsor Section' : 'Edit Section Details'}
              </h3>
              <button
                type="button"
                onClick={() => setModalSection(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Section Heading *</label>
                <input
                  type="text"
                  placeholder="e.g. Title Partner, Main Sponsors, Community Partners"
                  value={modalSection.section.heading}
                  onChange={(e) => setModalSection({
                    ...modalSection,
                    section: { ...modalSection.section, heading: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Section Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Special recognition for organizations powering our mission"
                  value={modalSection.section.description || ''}
                  onChange={(e) => setModalSection({
                    ...modalSection,
                    section: { ...modalSection.section, description: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalSection(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSection}
                  className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold cursor-pointer"
                >
                  {savingSection ? 'Saving...' : 'Save Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
