import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck, AlertCircle, CheckCircle2, Copy, Check, Printer,
  Calendar, Clock, MapPin, AlertTriangle, Loader2, ArrowLeft, RefreshCw, Info
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api.js';
import { formatCampDate } from '../utils/dateUtils.js';
import { birthDateError, latestAdultBirthDate } from '../utils/registrationAge.js';
import { subscribeToCampUpdates } from '../utils/campEvents.js';
import {
  BLOOD_GROUPS,
  BRANCHES,
  ROLES,
  ROLE_LABELS
} from '../constants/index.js';
import {
  isValidFullName,
  validateAndNormalizeMobile,
  isValidEmail
} from '../utils/validation.js';

const STORAGE_RECEIPT_KEY = 'bdc_donor_receipt';

function generateSubmissionKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const campIdParam = searchParams.get('camp_id');

  // Camp state
  const [camp, setCamp] = useState(null);
  const [campLoading, setCampLoading] = useState(true);
  const [campError, setCampError] = useState(null);

  // Receipt state (initialized null to ensure shared devices never expose a previous donor)
  const [receipt, setReceipt] = useState(null);

  // Unique submission key for idempotency across network retries
  const [submissionKey, setSubmissionKey] = useState(generateSubmissionKey);

  // Form fields (Aadhaar excluded, Address optional, College ID required for students)
  const [formData, setFormData] = useState({
    full_name: '',
    guardian_name: '',
    date_of_birth: '',
    blood_group: '',
    email: '',
    role: ROLES.STUDENT,
    branch: BRANCHES[0],
    institutional_id: '',
    mobile: '',
    address: '',
    consent_given: false
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [cmsRegText, setCmsRegText] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.content.getRegistrationText().then(res => {
      if (mounted && res?.success && res.data) {
        setCmsRegText(res.data);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // Load target camp
  useEffect(() => {
    let mounted = true;

    async function loadCamp() {
      setCampLoading(true);
      setCampError(null);

      try {
        let targetId = campIdParam;

        // If no camp_id in URL, find featured camp or active camp
        if (!targetId) {
          const featuredRes = await api.camps.getFeatured();
          if (featuredRes?.success && featuredRes.data) {
            targetId = featuredRes.data._id || featuredRes.data.id;
          }
        }

        if (!targetId) {
          if (mounted) {
            setCampError('No upcoming blood donation camp is currently active for online registration.');
            setCampLoading(false);
          }
          return;
        }

        const res = await api.registrations.getPublicCamp(targetId);
        if (mounted) {
          if (res?.success && res.data) {
            setCamp(res.data);
          } else {
            setCampError(res?.message || 'Unable to load camp details.');
          }
        }
      } catch (err) {
        if (mounted) {
          setCampError(err.message || 'Error loading camp information. Please try again.');
        }
      } finally {
        if (mounted) setCampLoading(false);
      }
    }

    loadCamp();

    const unsubscribe = subscribeToCampUpdates(() => {
      if (mounted) loadCamp();
    });

    const handleFocus = () => {
      if (mounted) loadCamp();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [campIdParam]);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === 'checkbox' ? checked : value;

    if (name === 'mobile') {
      // Numbers only, max 10 digits
      nextValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev => {
      const updated = { ...prev, [name]: nextValue };
      // Auto-adjust conditional fields when role changes
      if (name === 'role') {
        if (value === ROLES.OUTSIDE_SKIT) {
          updated.branch = '';
          updated.institutional_id = '';
        } else if (value === ROLES.STAFF_MEMBER) {
          updated.branch = prev.branch || BRANCHES[0];
          updated.institutional_id = '';
        } else if (value === ROLES.STUDENT) {
          updated.branch = BRANCHES.includes(prev.branch) ? prev.branch : BRANCHES[0];
          updated.institutional_id = '';
        }
      }
      return updated;
    });

    // Clear specific field error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate all fields client-side before submission
  const validateForm = () => {
    const errs = {};

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      errs.full_name = 'Please enter a valid full name.';
    }

    if (!formData.guardian_name || formData.guardian_name.trim().length < 2) {
      errs.guardian_name = "Please enter father's or guardian's name.";
    }

    const dobError = birthDateError(formData.date_of_birth);
    if (dobError) errs.date_of_birth = dobError;

    if (!BLOOD_GROUPS.includes(formData.blood_group)) {
      errs.blood_group = 'Please select a blood group.';
    }

    if (!formData.email || !isValidEmail(formData.email)) {
      errs.email = 'Please provide a valid email address.';
    }

    if (formData.role === ROLES.STUDENT) {
      if (!formData.branch) {
        errs.branch = 'Please select your branch.';
      }
      if (!formData.institutional_id || !formData.institutional_id.trim()) {
        errs.institutional_id = 'College ID is required for students.';
      }
    } else if (formData.role === ROLES.STAFF_MEMBER) {
      if (!formData.branch) errs.branch = 'Please select your branch.';
      if (!formData.institutional_id || !formData.institutional_id.trim()) {
        errs.institutional_id = 'Staff Employee ID is required.';
      }
    }

    const cleanMobile = (formData.mobile || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanMobile)) {
      errs.mobile = 'Please enter a valid 10-digit mobile number.';
    }

    // Note: Address is optional per settled product rules

    if (!formData.consent_given) {
      errs.consent_given = 'You must consent to voluntary blood donation.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const el = document.getElementById(firstErrorField);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!camp || !camp._id) {
      Swal.fire({
        icon: 'warning',
        title: 'Camp Unavailable',
        text: 'Target camp details could not be verified. Please refresh.',
        confirmButtonColor: '#981B24'
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        camp_id: camp.id || camp._id,
        full_name: formData.full_name.trim(),
        guardian_name: formData.guardian_name.trim(),
        date_of_birth: formData.date_of_birth,
        blood_group: formData.blood_group,
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        branch: formData.role === ROLES.OUTSIDE_SKIT ? null : formData.branch,
        institutional_id: formData.role === ROLES.OUTSIDE_SKIT ? null : formData.institutional_id.trim(),
        mobile: formData.mobile.replace(/\D/g, ''),
        address: formData.address ? formData.address.trim() : null,
        consent_given: formData.consent_given,
        submission_key: submissionKey
      };

      const res = await api.registrations.register(payload);

      if (res?.success && res.data) {
        const receiptData = {
          ...res.data,
          camp_name: res.data.camp_name || camp.name,
          camp_date: res.data.camp_date || camp.camp_date || camp.start_date,
          camp_venue: res.data.camp_venue || camp.venue,
          alreadyRegistered: Boolean(res.alreadyRegistered)
        };

        setReceipt(receiptData);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        Swal.fire({
          icon: 'success',
          title: res.alreadyRegistered ? 'Already Registered' : 'Registration Confirmed!',
          text: res.alreadyRegistered
            ? 'You are already registered for this camp. Your registration slip is displayed below.'
            : 'Your registration has been successfully recorded. Please save your Registration ID.',
          confirmButtonColor: '#981B24'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Registration Error',
          text: res?.message || 'Unable to complete registration. Please try again.',
          confirmButtonColor: '#981B24'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.message || 'A network error occurred while submitting your registration.',
        confirmButtonColor: '#981B24'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset to register another donor
  const handleRegisterAnother = () => {
    setReceipt(null);
    setSubmissionKey(generateSubmissionKey());
    setFormData({
      full_name: '',
      guardian_name: '',
      date_of_birth: '',
      blood_group: '',
      email: '',
      role: ROLES.STUDENT,
      branch: BRANCHES[0],
      institutional_id: '',
      mobile: '',
      address: '',
      consent_given: false
    });
    setErrors({});
  };

  // Copy registration ID
  const handleCopyId = () => {
    if (receipt?.registration_id) {
      navigator.clipboard.writeText(receipt.registration_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Format date for receipt
  const formatReceiptDate = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  // Format timestamp
  const formatTimestamp = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch {
      return iso;
    }
  };

  // ── Render 1: Loading Camp ───────────────────────────────────────────────────
  if (campLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
        <Loader2 className="w-10 h-10 text-[#981B24] animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Loading camp registration details...</p>
      </div>
    );
  }

  // ── Render 2: Camp Error or Not Found ─────────────────────────────────────────
  if (campError || !camp) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-[#FFF9F2] border border-[#E2D8CF] rounded-2xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif text-[#102B46] mb-2 font-bold">
            Registration Currently Unavailable
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            {campError || 'There are no blood donation camps open for online registration at this time.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#102B46] text-white text-sm font-medium hover:bg-[#0B1E33] transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
            <Link
              to="/camps"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
            >
              View Camps Schedule
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render 3: Screenshot Confirmation Receipt Screen ─────────────────────────
  if (receipt) {
    return (
      <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4">
        {/* Printable Receipt Card */}
        <div className="bg-[#FFF9F2] border border-[#E2D8CF] rounded-2xl shadow-md overflow-hidden print:border-none print:shadow-none">
          {/* Header Banner */}
          <div className="bg-[#981B24] px-6 py-6 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
              Registration Confirmed
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm mt-1">
              Swami Keshvanand Institute of Technology — Blood Donation Campaign
            </p>
          </div>

          {/* Already Registered Notice Banner */}
          {receipt.alreadyRegistered && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3.5 flex items-center gap-2.5 text-blue-900 text-xs sm:text-sm font-semibold">
              <Info className="w-5 h-5 text-blue-700 shrink-0" />
              <span>You were already registered for this camp. Here is your confirmed Registration ID and slip.</span>
            </div>
          )}

          {/* Screenshot Instruction Callout */}
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
                Please take a screenshot of this confirmation. Show your Registration ID at the registration desk.
              </p>
            </div>
          </div>

          {/* Main Receipt Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Registration ID Highlight Box */}
            <div className="bg-white border-2 border-[#981B24]/20 rounded-xl p-5 text-center shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Your Registration ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#981B24] tracking-tight">
                  {receipt.registration_id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Copy Registration ID"
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#981B24] hover:bg-slate-50 transition-colors print:hidden"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Keep this ID handy when arriving at the camp venue.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4" /> Print / Save as PDF
              </button>
              <button
                type="button"
                onClick={handleRegisterAnother}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#981B24] text-white text-sm font-medium hover:bg-[#80141D] transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" /> Register Another Donor
              </button>
            </div>
          </div>
        </div>

        {/* Home Navigation */}
        <div className="mt-6 text-center print:hidden">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-500 hover:text-[#981B24] inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
          </Link>
        </div>

        {/* Print-only slip — only visible when printing */}
                <style>{`
          @media print {
            @page { size: A5 portrait; margin: 18mm 14mm; }
            html, body {
              height: auto !important; min-height: 0 !important;
              margin: 0 !important; padding: 0 !important;
              background: #fff !important; overflow: visible !important;
            }
            body > :not(#print-slip) { display: none !important; }
            #print-slip {
              display: flex !important;
              position: static !important;
              inset: auto !important;
              width: 100% !important;
              height: 172mm !important;
              overflow: hidden !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              print-color-adjust: exact; -webkit-print-color-adjust: exact;
            }
          }
        `}</style>
        {createPortal(<div
          id="print-slip"
          className="hidden"
          style={{
            display: 'none',
            position: 'fixed', inset: 0, background: '#fff',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
            padding: '0', fontFamily: 'serif', zIndex: 9999
          }}
        >
          {/* Header */}
          <div style={{ width: '100%', background: '#981B24', color: '#fff', textAlign: 'center', padding: '18px 12px 14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '3px' }}>
              Swami Keshvanand Institute of Technology
            </div>
            <div style={{ fontSize: '11px', color: '#f9d1d4', letterSpacing: '0.03em' }}>
              Annual Blood Donation Campaign — {receipt.camp_name}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 20px', textAlign: 'center', gap: '16px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'sans-serif', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Registration ID
            </div>
            <div style={{ fontSize: '24px', maxWidth: '100%', overflowWrap: 'anywhere', boxSizing: 'border-box', fontFamily: 'monospace', fontWeight: 800, color: '#981B24', letterSpacing: '0.03em', lineHeight: 1.1, border: '2px solid #981B24', borderRadius: '10px', padding: '12px 16px' }}>
              {receipt.registration_id}
            </div>
            <div style={{ fontSize: '14px', fontFamily: 'sans-serif', color: '#1e293b', fontWeight: 600, marginTop: '4px' }}>
              {receipt.full_name}
            </div>
            <div style={{ fontSize: '11px', fontFamily: 'sans-serif', color: '#64748b' }}>
              {receipt.camp_venue || 'SKIT Campus'} &nbsp;·&nbsp; {formatReceiptDate(receipt.camp_date)}
            </div>
          </div>

          {/* Footer */}
          <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', padding: '10px 12px', textAlign: 'center', fontSize: '9px', fontFamily: 'sans-serif', color: '#94a3b8', letterSpacing: '0.04em' }}>
            Present this slip at the registration desk on camp day &nbsp;·&nbsp; SKIT Jaipur Blood Donation Campaign
          </div>
        </div>, document.body)}
      </div>
    );
  }

  // ── Render 4: Registration Closed Notice ──────────────────────────────────────
  if (!camp.is_registration_available) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-[#FFF9F2] border border-[#E2D8CF] rounded-2xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-[#981B24] flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-serif text-[#102B46] mb-2 font-bold">
            Registration Currently Closed
          </h2>
          <p className="text-sm font-medium text-slate-800 mb-2">
            Registration is currently closed for this camp.
          </p>
          <div className="bg-white/80 border border-[#E2D8CF] rounded-xl p-4 max-w-md mx-auto my-4 text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Camp:</span>
              <span className="font-semibold text-slate-900">{camp.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Venue:</span>
              <span className="font-semibold text-slate-900">{camp.venue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="font-semibold text-slate-900">{formatCampDate(camp.camp_date || camp.start_date)}</span>
            </div>
            {camp.camp_time && (
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-semibold text-slate-900">{camp.camp_time}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Please contact the NSS or camp coordinators for walk-in donor inquiries on the event day.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#102B46] text-white text-sm font-medium hover:bg-[#0B1E33] transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render 5: Public Registration Form ───────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Camp Header Card */}
      <div className="bg-[#FFF9F2] border border-[#E2D8CF] rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2D8CF] pb-4 mb-4">
          <span className="text-xs font-bold text-[#981B24] uppercase tracking-wider">
            {cmsRegText?.title || 'Online Donor Registration'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Registration Open
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102B46] tracking-tight mb-2">
          {camp.name}
        </h1>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#981B24]" />
            <span>{formatCampDate(camp.camp_date || camp.start_date)}</span>
          </div>
          {camp.camp_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#981B24]" />
              <span>{camp.camp_time}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#981B24]" />
            <span>{camp.venue}</span>
          </div>
        </div>
      </div>

      {/* Donor Instructions Notice */}
      <div className="flex items-start gap-3 text-xs sm:text-sm text-[#4A5568] bg-[#FAF4EB] border border-[#EAD7CF] rounded-2xl p-4 mb-8">
        <Info className="w-4 h-4 text-[#981B24] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1.5 leading-relaxed">
          <p>
            <strong className="text-[#102B46]">Donor Instructions:</strong> {cmsRegText?.description || 'Please provide accurate details. After submitting, a confirmed Registration ID and slip will be generated for presentation at the camp verification desk.'}
          </p>
          {cmsRegText?.eligibilityNotice && (
            <p className="text-[11px] text-slate-500">
              <strong className="font-semibold text-slate-700">Eligibility:</strong> {cmsRegText.eligibilityNotice}
            </p>
          )}
          {cmsRegText?.helpText && (
            <p className="text-[11px] text-slate-500">
              <strong className="font-semibold text-slate-700">Need Help:</strong> {cmsRegText.helpText}
            </p>
          )}
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-[#E2D8CF] rounded-2xl shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Field 1: Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Full Name <span className="text-[#981B24]">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24] transition-colors ${
                errors.full_name ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
              }`}
              disabled={submitting}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* Field 2: Father's / Guardian's Name */}
          <div>
            <label htmlFor="guardian_name" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Father's / Guardian's Name <span className="text-[#981B24]">*</span>
            </label>
            <input
              type="text"
              id="guardian_name"
              name="guardian_name"
              value={formData.guardian_name}
              onChange={handleChange}
              placeholder="Enter father's or guardian's name"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24] transition-colors ${
                errors.guardian_name ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
              }`}
              disabled={submitting}
            />
            {errors.guardian_name && (
              <p className="mt-1 text-xs text-red-600">{errors.guardian_name}</p>
            )}
          </div>

          {/* Row: DOB and Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 3: Date of Birth */}
            <div>
              <label htmlFor="date_of_birth" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Date of Birth (18+ only) <span className="text-[#981B24]">*</span>
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                onBlur={() => setErrors(prev => ({ ...prev, date_of_birth: birthDateError(formData.date_of_birth) }))}
                max={latestAdultBirthDate()}
                aria-invalid={Boolean(errors.date_of_birth)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24] transition-colors ${
                  errors.date_of_birth ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                }`}
                disabled={submitting}
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-xs text-red-600">{errors.date_of_birth}</p>
              )}
            </div>

            {/* Field 4: Blood Group */}
            <div>
              <label htmlFor="blood_group" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Blood Group <span className="text-[#981B24]">*</span>
              </label>
              <select
                id="blood_group"
                name="blood_group"
                required
                aria-invalid={Boolean(errors.blood_group)}
                value={formData.blood_group}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24] transition-colors ${
                  errors.blood_group ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                }`}
                disabled={submitting}
              >
                <option value="" disabled>Select blood group</option>
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>
                    {bg === 'UNKNOWN' ? "Don't Know" : bg}
                  </option>
                ))}
              </select>
              {errors.blood_group && (
                <p className="mt-1 text-xs text-red-600">{errors.blood_group}</p>
              )}
            </div>
          </div>

          {/* Field 5: Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Email Address <span className="text-[#981B24]">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24] transition-colors ${
                errors.email ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
              }`}
              disabled={submitting}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Field 6: Role / Participant Type */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Participant Role <span className="text-[#981B24]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
                <label
                  key={roleKey}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    formData.role === roleKey
                      ? 'border-[#981B24] bg-rose-50/40 text-[#981B24] font-semibold ring-1 ring-[#981B24]'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleKey}
                    checked={formData.role === roleKey}
                    onChange={handleChange}
                    className="accent-[#981B24]"
                    disabled={submitting}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Fields for Student / Staff (Role != OUTSIDE_SKIT) */}
          {/* Conditional Institutional Details */}
          {(formData.role === ROLES.STUDENT || formData.role === ROLES.STAFF_MEMBER) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {/* Field 7: Branch */}
              <div>
                <label htmlFor="branch" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  Branch <span className="text-[#981B24]">*</span>
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24] transition-colors ${
                    errors.branch ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                  }`}
                  disabled={submitting}
                >
                  {BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  {formData.role === ROLES.STAFF_MEMBER && <option value="BSH">BSH</option>}
                </select>
                {errors.branch && (
                  <p className="mt-1 text-xs text-red-600">{errors.branch}</p>
                )}
              </div>

              {/* Field 8: College ID */}
              <div>
                <label htmlFor="institutional_id" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                  {formData.role === ROLES.STUDENT ? 'College ID' : 'Staff Employee ID'} <span className="text-[#981B24]">*</span>
                </label>
                <input
                  type="text"
                  id="institutional_id"
                  name="institutional_id"
                  value={formData.institutional_id}
                  onChange={handleChange}
                  placeholder={formData.role === ROLES.STUDENT ? 'ex - B240345' : undefined}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24] transition-colors ${
                    errors.institutional_id ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                  }`}
                  disabled={submitting}
                />
                {errors.institutional_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.institutional_id}</p>
                )}
              </div>
            </div>
          )}

          {/* Field 9: Mobile Number */}
          <div>
            <label htmlFor="mobile" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Mobile Number <span className="text-[#981B24]">*</span>
            </label>
            <div className="relative flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#981B24]/30 focus-within:border-[#981B24]">
              <span className="inline-flex items-center px-3 bg-slate-100 text-slate-600 text-sm font-medium border-r border-slate-300">
                +91
              </span>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="9876543210"
                className={`w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none ${
                  errors.mobile ? 'bg-red-50/20' : ''
                }`}
                disabled={submitting}
              />
            </div>
            {errors.mobile && (
              <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>
            )}
          </div>

          {/* Field 10: Address (Optional) */}
          <div>
            <label htmlFor="address" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Residential Address <span className="text-slate-400 text-xs font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleChange}
              placeholder="Hostel / Street, City, State, PIN code (optional)"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#981B24]/30 focus:border-[#981B24] transition-colors ${
                errors.address ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
              }`}
              disabled={submitting}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Field 12: Voluntary Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50/30 border border-rose-100 cursor-pointer">
              <input
                type="checkbox"
                id="consent_given"
                name="consent_given"
                checked={formData.consent_given}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded text-[#981B24] focus:ring-[#981B24] accent-[#981B24]"
                disabled={submitting}
              />
              <span className="text-xs text-slate-700 leading-relaxed select-none">
                I confirm that the details provided are correct and I consent to participate in the voluntary blood donation camp.
              </span>
            </label>
            {errors.consent_given && (
              <p className="mt-1 text-xs text-red-600">{errors.consent_given}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || !formData.consent_given}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#981B24] text-white font-semibold text-sm hover:bg-[#80141D] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#981B24]/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Registration...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Register as Voluntary Donor</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              A unique Registration ID will be issued immediately upon submission.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
