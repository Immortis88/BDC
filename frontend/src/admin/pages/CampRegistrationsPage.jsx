import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useAdminCamp } from '../context/AdminCampContext.jsx';
import { adminService } from '../services/adminService.js';
import {
  Download,
  RefreshCw,
  Search,
  Calendar,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  SlidersHorizontal,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import Swal from 'sweetalert2';
import { BLOOD_GROUPS } from '../../constants/index.js';

// Allowlist of valid registration fields for Super Admin table view
const TABLE_COLUMNS = [
  { id: 'registration_code', label: 'Reg ID / Code', default: true },
  { id: 'full_name', label: 'Full Name', default: true },
  { id: 'guardian_name', label: 'Father / Guardian', default: false },
  { id: 'date_of_birth', label: 'Date of Birth', default: false },
  { id: 'blood_group', label: 'Blood Group', default: true },
  { id: 'role', label: 'Category / Role', default: true },
  { id: 'branch', label: 'Branch', default: true },
  { id: 'institutional_id', label: 'College / Employee ID', default: false },
  { id: 'mobile', label: 'Mobile Number', default: false },
  { id: 'email', label: 'Email', default: false },
  { id: 'created_at', label: 'Registered At', default: false },
  { id: 'outcome', label: 'Donation Status', default: true }
];

const DEFAULT_TABLE_COLUMN_IDS = TABLE_COLUMNS.filter(c => c.default).map(c => c.id);

// Allowlist of valid registration fields for Excel Export
const EXPORT_COLUMNS_AVAILABLE = [
  { id: 'registration_code', label: 'Registration Code' },
  { id: 'full_name', label: 'Full Name' },
  { id: 'guardian_name', label: 'Father / Guardian Name' },
  { id: 'date_of_birth', label: 'Date of Birth' },
  { id: 'blood_group', label: 'Blood Group' },
  { id: 'email', label: 'Email' },
  { id: 'participant_type', label: 'Category / Role' },
  { id: 'branch', label: 'Branch' },
  { id: 'college_id', label: 'College ID' },
  { id: 'employee_id', label: 'Employee ID' },
  { id: 'mobile', label: 'Mobile Number' },
  { id: 'address', label: 'Address' },
  { id: 'outcome', label: 'Donation Status' },
  { id: 'not_donated_reason', label: 'Not Donated Reason' },
  { id: 'donated_at', label: 'Donated At' },
  { id: 'created_at', label: 'Registered At' }
];

const EXPORT_PRESETS = {
  all: EXPORT_COLUMNS_AVAILABLE.map(c => c.id),
  standard: [
    'registration_code', 'full_name', 'guardian_name', 'date_of_birth',
    'blood_group', 'participant_type', 'branch', 'college_id', 'employee_id',
    'mobile', 'outcome', 'created_at'
  ],
  contact: [
    'registration_code', 'full_name', 'mobile', 'email', 'blood_group',
    'participant_type', 'branch'
  ]
};

export default function CampRegistrationsPage() {
  const { campId: paramCampId } = useParams();
  const { isSuperAdmin, hasPermission, user } = useAdminAuth();
  const { camps, selectedCampId, selectedCamp } = useAdminCamp();

  const effectiveCampId = Number(paramCampId) || Number(selectedCampId) || (camps && camps[0]?.id ? Number(camps[0].id) : null);

  // Actual camp data lookup - never substitute camp ID or calendar year
  const [loadedCampYear, setLoadedCampYear] = useState(null);

  const currentCamp = useMemo(() => {
    if (camps && camps.length > 0) {
      const match = camps.find(c => Number(c.id) === effectiveCampId);
      if (match) return match;
    }
    if (selectedCamp && Number(selectedCamp.id) === effectiveCampId) {
      return selectedCamp;
    }
    return null;
  }, [camps, selectedCamp, effectiveCampId]);

  useEffect(() => {
    let mounted = true;
    if (currentCamp?.camp_year) {
      setLoadedCampYear(currentCamp.camp_year);
      return;
    }
    if (effectiveCampId) {
      adminService.camps.getById(effectiveCampId).then(res => {
        if (mounted && res?.success && res.data?.camp_year) {
          setLoadedCampYear(res.data.camp_year);
        }
      }).catch(() => {});
    }
    return () => { mounted = false; };
  }, [effectiveCampId, currentCamp]);

  const actualCampYear = currentCamp?.camp_year || loadedCampYear || null;
  const codePrefix = actualCampYear ? `skitbdc${actualCampYear}_` : 'skitbdc_';

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [detailModalDonor, setDetailModalDonor] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState(EXPORT_PRESETS.standard);
  const [exportValidationError, setExportValidationError] = useState('');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  // Super Admin Table Column Customization
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (!isSuperAdmin) return DEFAULT_TABLE_COLUMN_IDS;
    try {
      const saved = localStorage.getItem('bdc_reg_columns_' + (user?.id || 'sa'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(id => TABLE_COLUMNS.some(c => c.id === id));
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {
      // Fallback
    }
    return DEFAULT_TABLE_COLUMN_IDS;
  });

  const handleToggleColumn = (colId) => {
    if (!isSuperAdmin) return;
    setVisibleColumns((prev) => {
      let next;
      if (prev.includes(colId)) {
        if (prev.length <= 1) return prev;
        next = prev.filter(c => c !== colId);
      } else {
        next = [...prev, colId];
      }
      try {
        localStorage.setItem('bdc_reg_columns_' + (user?.id || 'sa'), JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_TABLE_COLUMN_IDS);
    try {
      localStorage.removeItem('bdc_reg_columns_' + (user?.id || 'sa'));
    } catch (e) {}
  };

  // Close column popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setColumnPopoverOpen(false);
      }
    }
    if (columnPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [columnPopoverOpen]);

  // Input states (immediate text inputs)
  const [nameInput, setNameInput] = useState('');
  const [collegeIdInput, setCollegeIdInput] = useState('');
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [debouncedIds, setDebouncedIds] = useState({ collegeId: '', employeeId: '' });
  const [codeSuffix, setCodeSuffix] = useState('');
  const [codeValidationError, setCodeValidationError] = useState('');

  // Debounced text inputs (~300ms)
  const [debouncedName, setDebouncedName] = useState('');
  const [debouncedCodeSuffix, setDebouncedCodeSuffix] = useState('');

  // Dropdown and Date filters (immediate)
  const [blood, setBlood] = useState('');
  const [role, setRole] = useState('');
  const [branch, setBranch] = useState('');
  const [donorStatus, setDonorStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateError, setDateError] = useState('');

  const [serverCounts, setServerCounts] = useState({ total: 0, donated: 0, notDonated: 0 });

  const canUpdate = isSuperAdmin || hasPermission('camp.registrations', effectiveCampId);
  const canView = canUpdate || hasPermission('camp.registrations.view', effectiveCampId);
  const canExport = isSuperAdmin;

  // Debounce Name input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIds({ collegeId: collegeIdInput.trim(), employeeId: employeeIdInput.trim() });
    }, 300);
    return () => clearTimeout(timer);
  }, [collegeIdInput, employeeIdInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(nameInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameInput]);

  // Debounce Code Suffix input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCodeSuffix(codeSuffix);
    }, 300);
    return () => clearTimeout(timer);
  }, [codeSuffix]);

  // Date range validation handler
  const handleDateFromChange = (val) => {
    setDateFrom(val);
    if (val && dateTo && val > dateTo) {
      setDateError('End date cannot precede start date.');
    } else {
      setDateError('');
    }
  };

  const handleDateToChange = (val) => {
    setDateTo(val);
    if (dateFrom && val && dateFrom > val) {
      setDateError('End date cannot precede start date.');
    } else {
      setDateError('');
    }
  };

  // Registration code suffix change & paste handling
  const handleCodeSuffixChange = (val) => {
    const match = val.match(/^skitbdc(\d{4})_(.*)$/i);
    if (match) {
      const pastedYear = match[1];
      const pastedSuffix = match[2];
      if (actualCampYear && String(actualCampYear) !== pastedYear) {
        setCodeValidationError(`Code belongs to Camp ${pastedYear}, but selected camp is ${actualCampYear}.`);
      } else {
        setCodeValidationError('');
      }
      setCodeSuffix(pastedSuffix);
      return;
    }

    setCodeValidationError('');
    setCodeSuffix(val);
  };

  const handleCodePaste = (e) => {
    const text = e.clipboardData.getData('text').trim();
    const match = text.match(/^skitbdc(\d{4})_(.*)$/i);
    if (match) {
      e.preventDefault();
      const pastedYear = match[1];
      const pastedSuffix = match[2];
      if (actualCampYear && String(actualCampYear) !== pastedYear) {
        setCodeValidationError(`Code belongs to Camp ${pastedYear}, but selected camp is ${actualCampYear}.`);
      } else {
        setCodeValidationError('');
      }
      setCodeSuffix(pastedSuffix);
    }
  };

  // Request tracking to discard outdated or cross-camp responses
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const activeCampIdRef = useRef(effectiveCampId);

  // Camp change: clear suffix, reset pagination, and discard previous camp results
  useEffect(() => {
    if (activeCampIdRef.current !== effectiveCampId) {
      activeCampIdRef.current = effectiveCampId;
      setCodeSuffix('');
      setDebouncedCodeSuffix('');
      setNameInput('');
      setCollegeIdInput('');
      setEmployeeIdInput('');
      setDebouncedIds({ collegeId: '', employeeId: '' });
      setDebouncedName('');
      setBlood('');
      setRole('');
      setBranch('');
      setDonorStatus('');
      setDateFrom('');
      setDateTo('');
      setDateError('');
      setCodeValidationError('');
      setRegistrations([]);
      setServerCounts({ total: 0, donated: 0, notDonated: 0 });
      setPagination({ totalPages: 1, total: 0 });
      setPage(1);
    }
  }, [effectiveCampId]);

  // Load Data with cancellation of outdated/stale requests
  const loadData = useCallback(async (targetPage, filterValues) => {
    if (!effectiveCampId || !canView) return;

    // Reject date range if end precedes start
    if (filterValues.dateFrom && filterValues.dateTo && filterValues.dateFrom > filterValues.dateTo) {
      setDateError('End date cannot precede start date.');
      return;
    }

    // Cancel in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const currentReqId = ++requestIdRef.current;
    const requestCampId = effectiveCampId;

    setLoading(true);
    setLoadError(null);

    let regIdParam = '';
    if (filterValues.codeSuffix && filterValues.codeSuffix.trim()) {
      regIdParam = `${actualCampYear ? `skitbdc${actualCampYear}_` : ''}${filterValues.codeSuffix.trim()}`;
    }

    try {
      const res = await adminService.registrations.getByCamp(requestCampId, {
        name: (filterValues.name || '').trim(),
        collegeId: filterValues.collegeId,
        employeeId: filterValues.employeeId,
        regId: regIdParam,
        blood: filterValues.blood,
        role: filterValues.role,
        branch: filterValues.branch,
        outcome: filterValues.donorStatus,
        dateFrom: filterValues.dateFrom,
        dateTo: filterValues.dateTo,
        page: targetPage,
        limit: 25
      }, { signal: abortController.signal });

      // Discard response if outdated or camp has changed
      if (requestIdRef.current !== currentReqId || activeCampIdRef.current !== requestCampId) {
        return;
      }

      if (res.success) {
        setRegistrations(res.data || []);
        setServerCounts({
          total: res.stats?.total ?? 0,
          donated: res.stats?.donated ?? 0,
          notDonated: res.stats?.not_donated ?? 0
        });
        if (res.pagination) {
          setPagination({
            totalPages: res.pagination.totalPages || 1,
            total: res.pagination.total || (res.data?.length || 0)
          });
          setPage(res.pagination.page || targetPage);
        }
      } else {
        throw new Error(res.message || 'Could not load registrations.');
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (requestIdRef.current !== currentReqId || activeCampIdRef.current !== requestCampId) return;
      setLoadError(error.message || 'Unable to load registrations.');
    } finally {
      if (requestIdRef.current === currentReqId && activeCampIdRef.current === requestCampId) {
        setLoading(false);
      }
    }
  }, [effectiveCampId, canView, actualCampYear]);

  // Combined active filters memo
  const activeFilters = useMemo(() => ({
    ...debouncedIds,
    name: debouncedName,
    codeSuffix: debouncedCodeSuffix,
    blood,
    role,
    branch,
    donorStatus,
    dateFrom,
    dateTo
  }), [debouncedIds, debouncedName, debouncedCodeSuffix, blood, role, branch, donorStatus, dateFrom, dateTo]);

  // Automatic filter trigger: reset to page 1 on filter changes
  useEffect(() => {
    if (canView && effectiveCampId) {
      setPage(1);
      loadData(1, activeFilters);
    }
  }, [activeFilters, effectiveCampId, canView, loadData]);

  // Clear filters: reset all filters, page 1, immediately reload
  const handleClearFilters = () => {
    setCollegeIdInput('');
    setEmployeeIdInput('');
    setDebouncedIds({ collegeId: '', employeeId: '' });
    setNameInput('');
    setCodeSuffix('');
    setDebouncedName('');
    setDebouncedCodeSuffix('');
    setBlood('');
    setRole('');
    setBranch('');
    setDonorStatus('');
    setDateFrom('');
    setDateTo('');
    setDateError('');
    setCodeValidationError('');
    setPage(1);
    loadData(1, {
      name: '',
      codeSuffix: '',
      blood: '',
      role: '',
      branch: '',
      donorStatus: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Status Change handler
  const handleStatusChange = async (recordId, newStatus) => {
    if (!canUpdate) return;
    try {
      const res = await adminService.registrations.updateStatus(recordId, {
        status: newStatus
      });
      if (res.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Status changed to ${newStatus === 'DONATED' ? 'Donated' : 'Not Donated'}`,
          showConfirmButton: false,
          timer: 1500
        });
        if (detailModalDonor && detailModalDonor.id === recordId) {
          setDetailModalDonor(prev => ({
            ...prev,
            outcome: newStatus,
            donor_status: newStatus
          }));
        }
        await loadData(page, activeFilters);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: res.message || 'Could not update donation status.'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to update donation status.'
      });
    }
  };

  const handleBloodGroupChange = async (recordId, bloodGroup) => {
    if (!isSuperAdmin) return;
    const res = await adminService.registrations.updateBloodGroup(recordId, bloodGroup);
    if (res.success) {
      setDetailModalDonor(prev => prev?.id === recordId ? { ...prev, blood_group: bloodGroup } : prev);
      await loadData(page, activeFilters);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Blood group updated.', showConfirmButton: false, timer: 1500 });
    } else {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: res.message || 'Could not update blood group.' });
    }
  };

  // Open Export Dialog
  const handleOpenExportDialog = () => {
    if (!canExport) {
      Swal.fire({ icon: 'warning', title: 'Export Restricted', text: 'You do not have registration export permissions.' });
      return;
    }
    setExportValidationError('');
    setExportModalOpen(true);
  };

  // Execute Excel Export using current input values even if debounce has not finished
  const handleExecuteExport = async () => {
    if (!isSuperAdmin) return;
    if (selectedExportColumns.length === 0) {
      setExportValidationError('Please select at least one column to export.');
      return;
    }

    setExporting(true);
    setExportValidationError('');

    let currentRegId = '';
    if (codeSuffix && codeSuffix.trim()) {
      currentRegId = `${actualCampYear ? `skitbdc${actualCampYear}_` : ''}${codeSuffix.trim()}`;
    }

    try {
      const res = await adminService.registrations.exportExcel(effectiveCampId, {
        columns: selectedExportColumns,
        name: nameInput.trim(),
        regId: currentRegId,
        blood,
        role,
        branch,
        outcome: donorStatus,
        dateFrom,
        dateTo
      });

      if (res.success) {
        setExportModalOpen(false);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Registration records exported successfully (Excel)',
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        setExportValidationError(res.message || 'Export failed.');
      }
    } catch (err) {
      setExportValidationError(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const campYearDisplay = actualCampYear || effectiveCampId;

  // Render cell content based on column id
  const renderCellContent = (donor, colId) => {
    const outcome = donor.outcome || donor.donor_status || 'NOT_DONATED';
    const canChangeOutcome = canUpdate && (isSuperAdmin || outcome !== 'DONATED');
    const regCode = donor.registration_code || donor.reg_code || `BDC-${donor.id}`;
    const pType = donor.participant_type || donor.role || donor.category;
    const roleLabel = pType === 'STUDENT' ? 'Student' : pType === 'STAFF_MEMBER' || pType === 'STAFF' ? 'Staff' : 'Outside SKIT';
    const instId = donor.college_id || donor.employee_id || donor.institutional_id || '—';

    switch (colId) {
      case 'registration_code':
        return <span className="font-mono font-bold text-[#981B24]">{regCode}</span>;
      case 'full_name':
        return <span className="font-bold text-slate-900">{donor.full_name}</span>;
      case 'guardian_name':
        return <span className="text-slate-700">{donor.guardian_name || '—'}</span>;
      case 'date_of_birth':
        return <span className="text-slate-600">{donor.date_of_birth ? donor.date_of_birth.slice(0, 10) : '—'}</span>;
      case 'blood_group':
        return isSuperAdmin ? (
          <select
            value={donor.blood_group || 'UNKNOWN'}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => handleBloodGroupChange(donor.id, event.target.value)}
            className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
            aria-label={`Edit blood group for ${donor.full_name}`}
          >
            {BLOOD_GROUPS.map(group => <option key={group} value={group}>{group === 'UNKNOWN' ? "Don't Know" : group}</option>)}
          </select>
        ) : <span className="font-semibold text-slate-700">{donor.blood_group || "Unknown"}</span>;
      case 'role':
        return <span className="text-slate-600">{roleLabel}</span>;
      case 'branch':
        return <span className="text-slate-600">{donor.branch || '—'}</span>;
      case 'institutional_id':
        return <span className="font-mono text-slate-600 text-xs">{instId}</span>;
      case 'mobile':
        return <span className="font-mono text-slate-700">{donor.mobile || '—'}</span>;
      case 'email':
        return <span className="text-slate-600 truncate max-w-[140px] block">{donor.email || '—'}</span>;
      case 'created_at':
        return <span className="text-slate-500 text-xs">{donor.created_at ? donor.created_at.slice(0, 10) : '—'}</span>;
      case 'outcome':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={outcome}
              disabled={!canChangeOutcome}
              onChange={(e) => handleStatusChange(donor.id, e.target.value)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border appearance-none cursor-pointer focus:outline-none transition ${
                outcome === 'DONATED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
              }`}
            >
              <option value="NOT_DONATED" disabled={!isSuperAdmin && outcome === 'DONATED'}>Not Donated</option>
              <option value="DONATED">Donated</option>
            </select>
          </div>
        );
      default:
        return '—';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Breadcrumb Header */}
      <div className="text-xs font-semibold text-slate-500">
        BDC CAMP {campYearDisplay} → <span className="font-bold text-slate-900">Registration</span>
      </div>

      {/* Immutability Policy Notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 text-xs text-amber-800">
        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <span>
          <strong>Registrations are permanent records.</strong> Once a donor registers on the website, their record cannot be deleted from this panel — only the donation status can be updated. To remove a record, a direct database query is required.
        </span>
      </div>

      {/* 3 Summary Stat Cards: Total, Donated, Not Donated */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TOTAL */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            TOTAL
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            {serverCounts.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Registered for BDC CAMP {campYearDisplay}
          </div>
        </div>

        {/* DONATED */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 p-6 shadow-2xs bg-emerald-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            DONATED
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 mt-2">
            {serverCounts.donated}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Verified blood donors
          </div>
        </div>

        {/* NOT DONATED */}
        <div className="bg-white rounded-2xl border border-rose-200/90 p-6 shadow-2xs bg-rose-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
            NOT DONATED
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 mt-2">
            {serverCounts.notDonated}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Registered, not yet donated or deferred
          </div>
        </div>
      </div>

      {/* Filter Bar - Always Mounted, Focused, and Editable */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label htmlFor="registration-college-id" className="block font-bold text-slate-500 uppercase text-[10px] mb-1">COLLEGE ID</label>
            <input
              id="registration-college-id"
              type="text"
              placeholder="Search College ID"
              value={collegeIdInput}
              onChange={(e) => setCollegeIdInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>
          <div>
            <label htmlFor="registration-employee-id" className="block font-bold text-slate-500 uppercase text-[10px] mb-1">EMPLOYEE ID</label>
            <input
              id="registration-employee-id"
              type="text"
              placeholder="Search Employee ID"
              value={employeeIdInput}
              onChange={(e) => setEmployeeIdInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">DATE FROM</label>
            <input
              type="date"
              placeholder="YYYY-MM-DD"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">DATE TO</label>
            <input
              type="date"
              placeholder="YYYY-MM-DD"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">SEARCH NAME</label>
            <input
              type="text"
              placeholder="Donor Name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">BLOOD</label>
            <select
              value={blood}
              onChange={(e) => setBlood(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="">Blood ▾</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">ROLE</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="">Role ▾</option>
              <option value="STUDENT">Student</option>
              <option value="STAFF_MEMBER">Staff Member</option>
              <option value="OUTSIDE_SKIT">Outside SKIT</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">BRANCH</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="">Branch ▾</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="BSH">BSH</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">STATUS</label>
            <select
              value={donorStatus}
              onChange={(e) => setDonorStatus(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <option value="">All Statuses ▾</option>
              <option value="DONATED">Donated</option>
              <option value="NOT_DONATED">Not Donated</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-500 uppercase text-[10px] mb-1">REG CODE</label>
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden focus-within:ring-1 focus-within:ring-red-600 focus-within:border-red-600 bg-white">
              <span className="px-2 py-1.5 bg-slate-100 text-slate-500 font-mono text-xs border-r border-slate-200 select-none shrink-0">
                {codePrefix}
              </span>
              <input
                type="text"
                placeholder="0001"
                value={codeSuffix}
                onChange={(e) => handleCodeSuffixChange(e.target.value)}
                onPaste={handleCodePaste}
                className="w-full px-2 py-1.5 text-xs font-mono focus:outline-none bg-transparent"
              />
            </div>
            {codeValidationError && (
              <p className="text-[10px] text-rose-600 font-semibold mt-1 leading-tight">
                {codeValidationError}
              </p>
            )}
          </div>
        </div>

        {dateError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {dateError}
          </div>
        )}

        {/* Action Buttons: Clear, Super Admin Columns, Export Excel, Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Clear
            </button>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                Updating...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Super Admin Column Selection Dropdown */}
            {isSuperAdmin && (
              <div className="relative" ref={popoverRef}>
                <button
                  type="button"
                  onClick={() => setColumnPopoverOpen(!columnPopoverOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  title="Customize visible table columns (Super Admin only)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Columns ({visibleColumns.length})</span>
                </button>

                {columnPopoverOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-40 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-bold text-slate-800">Visible Columns</span>
                      <button
                        type="button"
                        onClick={handleResetColumns}
                        className="text-[11px] font-semibold text-red-600 hover:underline"
                      >
                        Reset Default
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {TABLE_COLUMNS.map(col => {
                        const checked = visibleColumns.includes(col.id);
                        return (
                          <label
                            key={col.id}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer select-none text-slate-700"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleColumn(col.id)}
                              className="rounded text-red-600 focus:ring-red-500"
                            />
                            <span>{col.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {canExport && (
              <button
                type="button"
                onClick={handleOpenExportDialog}
                disabled={exporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadData(page, activeFilters)}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                {visibleColumns.map(colId => {
                  const def = TABLE_COLUMNS.find(c => c.id === colId);
                  return (
                    <th key={colId} className="py-3.5 px-5">
                      {def?.label || colId}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && registrations.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-xs text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                      <span>Loading registrations...</span>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-xs text-rose-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span>{loadError}</span>
                      <button
                        type="button"
                        onClick={() => loadData(page, activeFilters)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : registrations.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="py-12 text-center text-xs text-slate-400">
                    No donor registration records found matching active filters.
                  </td>
                </tr>
              ) : (
                registrations.map((donor) => (
                  <tr
                    key={donor.id}
                    onClick={() => setDetailModalDonor(donor)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    {visibleColumns.map(colId => (
                      <td key={colId} className="py-3.5 px-5">
                        {renderCellContent(donor, colId)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{registrations.length}</strong> of{' '}
            <strong className="text-slate-800">{pagination.total || registrations.length}</strong> records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (page > 1) {
                  const newPage = page - 1;
                  setPage(newPage);
                  loadData(newPage, activeFilters);
                }
              }}
              disabled={page <= 1}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">Page {page} of {pagination.totalPages || 1}</span>
            <button
              type="button"
              onClick={() => {
                if (page < (pagination.totalPages || 1)) {
                  const newPage = page + 1;
                  setPage(newPage);
                  loadData(newPage, activeFilters);
                }
              }}
              disabled={page >= (pagination.totalPages || 1)}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Export Columns Selection Modal */}
      {isSuperAdmin && exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Export Registrations (Excel)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              The export will contain one header row and the selected columns with their data.
            </p>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Select Presets
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedExportColumns(EXPORT_PRESETS.all)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    selectedExportColumns.length === EXPORT_PRESETS.all.length
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Columns
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExportColumns(EXPORT_PRESETS.standard)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    selectedExportColumns.length === EXPORT_PRESETS.standard.length
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Standard / Default
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExportColumns(EXPORT_PRESETS.contact)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    selectedExportColumns.length === EXPORT_PRESETS.contact.length
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Contact Only
                </button>
              </div>
            </div>

            {/* Checkbox Grid */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Individual Column Selection ({selectedExportColumns.length} selected)
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {EXPORT_COLUMNS_AVAILABLE.map((col) => {
                  const isChecked = selectedExportColumns.includes(col.id);
                  return (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 p-1 rounded-md hover:bg-white cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedExportColumns(prev =>
                            prev.includes(col.id)
                              ? prev.filter(c => c !== col.id)
                              : [...prev, col.id]
                          );
                          setExportValidationError('');
                        }}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span className="truncate text-slate-800">{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {exportValidationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {exportValidationError}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteExport}
                disabled={exporting}
                className="px-4 py-2 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {exporting ? 'Generating Excel...' : 'Download Excel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donor Record Details Modal */}
      {detailModalDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-[#981B24]">
                  {detailModalDonor.registration_code || detailModalDonor.reg_code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {detailModalDonor.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalDonor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category / Role</span>
                  <span className="font-semibold text-slate-900">
                    {detailModalDonor.participant_type || detailModalDonor.category || detailModalDonor.role}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Group</span>
                  {isSuperAdmin ? (
                    <select
                      value={detailModalDonor.blood_group || 'UNKNOWN'}
                      onChange={(event) => handleBloodGroupChange(detailModalDonor.id, event.target.value)}
                      className="mt-1 text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-900"
                      aria-label="Edit blood group"
                    >
                      {BLOOD_GROUPS.map(group => <option key={group} value={group}>{group === 'UNKNOWN' ? "Don't Know" : group}</option>)}
                    </select>
                  ) : (
                    <span className="font-semibold text-slate-900">{detailModalDonor.blood_group || "Unknown"}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Mobile Phone</span>
                  <span className="font-mono font-semibold text-slate-900">{detailModalDonor.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Email</span>
                  <span className="font-semibold text-slate-900 truncate block">{detailModalDonor.email}</span>
                </div>
              </div>

              {(detailModalDonor.college_id || detailModalDonor.branch) && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">College ID</span>
                    <span className="font-semibold text-slate-900">{detailModalDonor.college_id || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Branch</span>
                    <span className="font-semibold text-slate-900">{detailModalDonor.branch || '—'}</span>
                  </div>
                </div>
              )}

              {detailModalDonor.employee_id && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Staff Employee ID</span>
                  <span className="font-semibold text-slate-900">{detailModalDonor.employee_id}</span>
                </div>
              )}

              {detailModalDonor.address && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Residential Address</span>
                  <span className="text-slate-800">{detailModalDonor.address}</span>
                </div>
              )}

              {/* Status Selector in Modal */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">Donation Status</span>
                  <span className="text-[11px] text-slate-500">
                    {(detailModalDonor.outcome || detailModalDonor.donor_status) === 'DONATED'
                      ? 'Verified as successfully completed blood donation'
                      : 'Registered, not yet donated or deferred'}
                  </span>
                </div>
                <select
                  value={detailModalDonor.outcome || detailModalDonor.donor_status || 'NOT_DONATED'}
                  disabled={!canUpdate || (!isSuperAdmin && (detailModalDonor.outcome || detailModalDonor.donor_status) === 'DONATED')}
                  onChange={(e) => handleStatusChange(detailModalDonor.id, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border appearance-none cursor-pointer focus:outline-none transition ${
                    (detailModalDonor.outcome || detailModalDonor.donor_status) === 'DONATED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <option value="NOT_DONATED" disabled={!isSuperAdmin && (detailModalDonor.outcome || detailModalDonor.donor_status) === 'DONATED'}>Not Donated</option>
                  <option value="DONATED">Donated</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalDonor(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
