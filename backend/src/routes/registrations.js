'use strict';
const express     = require('express');
const crypto      = require('crypto');
const { pool }    = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { birthDateError } = require('../utils/registrationAge');
const { createRegistrationWorkbook } = require('../utils/registrationWorkbook');
const { registrationError } = require('../security');
const { rateLimit, ipKey, emailKey } = require('../middleware/rateLimit');

const router = express.Router();

const isSuperAdmin = (req) => req.adminRole === 'SUPER_ADMIN';

async function getLiveCampId() {
  const [[row]] = await pool.query('SELECT live_camp_id FROM site_state WHERE id = 1');
  return row?.live_camp_id ?? null;
}

function computeFingerprint(name, mobile, email) {
  const secret = process.env.FINGERPRINT_KEY || 'bdc_default_hmac_secret_key_32bytes';
  const tuple = `${name.toLowerCase().trim()}|${mobile.replace(/[\s()-]/g, '')}|${email.toLowerCase().trim()}`;
  return crypto.createHmac('sha256', secret).update(tuple).digest();
}

// ─── POST /api/registrations ── PUBLIC registration submission ────────────────
router.post('/', rateLimit({ max: 600, key: ipKey }), rateLimit({ max: 8, key: emailKey }), async (req, res, next) => {
  try {
    const validationError = registrationError(req.body);
    if (validationError) return res.status(400).json({ ok: false, message: validationError });
    const {
      camp_id,
      full_name,
      guardian_name,
      date_of_birth,
      blood_group,
      email,
      role, // 'STUDENT' | 'STAFF_MEMBER' | 'OUTSIDE_SKIT'
      participant_type: explicitType,
      branch,
      institutional_id, // College ID for student, Employee ID for staff
      college_id: explicitCollegeId,
      employee_id: explicitEmployeeId,
      mobile,
      address,
      consent_given,
      submission_key
    } = req.body;

    const liveCampId = await getLiveCampId();
    if (!liveCampId) {
      return res.status(400).json({ ok: false, message: 'No blood donation camp is currently live for registration.' });
    }

    let targetCampId = liveCampId;
    if (camp_id !== undefined && camp_id !== null && camp_id !== '') {
      const numeric = typeof camp_id === 'number' ? camp_id : parseInt(String(camp_id).split('-').pop(), 10);
      if (!isNaN(numeric) && numeric > 0) {
        targetCampId = numeric;
      }
    }
    if (targetCampId !== liveCampId) {
      return res.status(400).json({ ok: false, message: 'Online registration is only accepted for the active live camp.' });
    }

    const [[camp]] = await pool.query('SELECT id, camp_year, public_title, venue, camp_date, registration_open FROM camps WHERE id = ?', [targetCampId]);
    if (!camp || !camp.registration_open) {
      return res.status(400).json({ ok: false, message: 'Registration for this camp is currently closed.' });
    }

    // Basic Validations
    if (!full_name || full_name.trim().length < 2) return res.status(400).json({ ok: false, message: 'Valid full name is required.' });
    if (!guardian_name || guardian_name.trim().length < 2) return res.status(400).json({ ok: false, message: 'Valid father / guardian name is required.' });
    const dobError = birthDateError(date_of_birth);
    if (dobError) return res.status(400).json({ ok: false, message: dobError });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ ok: false, message: 'Valid email address is required.' });
    if (!mobile) return res.status(400).json({ ok: false, message: 'Mobile number is required.' });
    if (!consent_given) return res.status(400).json({ ok: false, message: 'Voluntary consent must be given to register.' });

    const allowedBlood = ['A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN'];
    if (!allowedBlood.includes(blood_group)) {
      return res.status(400).json({ ok: false, message: 'Please select a valid blood group.' });
    }
    const blood = blood_group;

    // Normalize participant type
    const pType = explicitType || (role === 'STUDENT' ? 'STUDENT' : (role === 'STAFF' || role === 'STAFF_MEMBER' ? 'STAFF_MEMBER' : 'OUTSIDE_SKIT'));

    // Category field rule enforcement (matches SQL CHECK constraint)
    let collegeId = null;
    let employeeId = null;
    let branchName = null;

    if (pType === 'STUDENT') {
      collegeId = (explicitCollegeId || institutional_id || '').trim();
      branchName = (branch || '').trim();
      if (!collegeId) return res.status(400).json({ ok: false, message: 'Student College ID is required.' });
      if (!branchName) return res.status(400).json({ ok: false, message: 'Branch selection is required for students.' });
    } else if (pType === 'STAFF_MEMBER') {
      employeeId = (explicitEmployeeId || institutional_id || '').trim();
      branchName = typeof branch === 'string' ? branch.trim() : '';
      if (!branchName) return res.status(400).json({ ok: false, message: 'Branch selection is required for staff.' });
      if (!employeeId) return res.status(400).json({ ok: false, message: 'Staff Employee ID is required.' });
    }

    const cleanMobile = mobile.replace(/[\s()-]/g, '');
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = full_name.trim();
    const fingerprint = computeFingerprint(cleanName, cleanMobile, cleanEmail);

    // Duplicate check in same camp
    const [[existing]] = await pool.query(
      'SELECT id, registration_code, full_name, created_at FROM registrations WHERE camp_id = ? AND duplicate_fingerprint = ?',
      [targetCampId, fingerprint]
    );

    async function duplicateResponse(existing, db = pool) {
      // Only the original high-entropy submission key can recover a receipt.
      const attemptHash = crypto.createHash('sha256').update(submission_key || '').digest();
      const [[attempt]] = submission_key ? await db.query(
        `SELECT id FROM registration_attempts WHERE attempt_key_hash = ? AND registration_id = ?
         AND camp_id = ? AND state = 'SUCCEEDED' AND expires_at > NOW(6)`,
        [attemptHash, existing.id, targetCampId]
      ) : [[]];
      if (!attempt) return res.status(409).json({
        ok: false, success: false,
        message: 'Unable to complete online registration with these details. Please contact the camp coordinator for assistance.'
      });
      return res.json({
        ok: true,
        success: true,
        alreadyRegistered: true,
        message: 'A registration with these details was already recorded for this camp.',
        data: {
          registration_id: existing.registration_code,
          registration_code: existing.registration_code,
          full_name: existing.full_name,
          camp_name: camp.public_title,
          camp_date: camp.camp_date,
          camp_venue: camp.venue,
          created_at: existing.created_at
        }
      });
    }
    if (existing) return await duplicateResponse(existing);

    // Atomic insert and sequence allocation
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock counter
      const [[counterRow]] = await conn.query(
        'SELECT next_sequence FROM registration_counters WHERE camp_id = ? FOR UPDATE',
        [targetCampId]
      );
      // Serialize duplicate checks with sequence allocation, including simultaneous submissions.
      const [[racedDuplicate]] = await conn.query(
        'SELECT id, registration_code, full_name, created_at FROM registrations WHERE camp_id = ? AND duplicate_fingerprint = ? FOR UPDATE',
        [targetCampId, fingerprint]
      );
      if (racedDuplicate) {
        await conn.rollback();
        return await duplicateResponse(racedDuplicate, conn);
      }
      if (!counterRow) throw new Error('Registration counter is not configured.');
      const seq = counterRow ? counterRow.next_sequence : 1;
      await conn.query('UPDATE registration_counters SET next_sequence = next_sequence + 1 WHERE camp_id = ?', [targetCampId]);

      const registrationCode = `skitbdc${camp.camp_year}_${String(seq).padStart(4, '0')}`;
      const now = new Date();

      const [insertRes] = await conn.query(
        `INSERT INTO registrations (
          camp_id, sequence_number, registration_code, full_name, guardian_name,
          date_of_birth, blood_group, email, participant_type, branch,
          college_id, employee_id, mobile, address, consent_given,
          consent_version, consented_at, duplicate_fingerprint, outcome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'v2026.1', ?, ?, 'NOT_DONATED')`,
        [
          targetCampId,
          seq,
          registrationCode,
          cleanName,
          guardian_name.trim(),
          date_of_birth,
          blood,
          cleanEmail,
          pType,
          branchName,
          collegeId,
          employeeId,
          cleanMobile,
          address?.trim() || null,
          now,
          fingerprint
        ]
      );

      const regId = insertRes.insertId;

      // Record successful attempt
      const attemptKey = submission_key || crypto.randomUUID();
      const attemptHash = crypto.createHash('sha256').update(attemptKey).digest();
      const payloadHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest();
      const expiresAt = new Date(Date.now() + 86400000);

      await conn.query(
        `INSERT INTO registration_attempts (camp_id, attempt_key_hash, payload_hash, state, registration_id, expires_at)
         VALUES (?, ?, ?, 'SUCCEEDED', ?, ?)`,
        [targetCampId, attemptHash, payloadHash, regId, expiresAt]
      );

      await conn.commit();

      return res.status(201).json({
        ok: true,
        success: true,
        message: 'Registration confirmed successfully.',
        data: {
          registration_id: registrationCode,
          registration_code: registrationCode,
          full_name: cleanName,
          camp_name: camp.public_title,
          camp_date: camp.camp_date,
          camp_venue: camp.venue,
          created_at: now.toISOString()
        }
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN ROUTES (Require Auth) ──────────────────────────────────────────────
router.use(requireAuth);
// The catalogue grants registration access as one module (view and outcomes; exports are Super Admin only).
router.use(async (req, res, next) => {
  if (isSuperAdmin(req)) return next();
  try {
    const legacy = req.method === 'GET' ? (req.path === '/export' ? 'camp.registrations.export' : 'camp.registrations.view') : 'camp.registrations';
    const [[grant]] = await pool.query(
      'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key IN (?, ?)',
      [req.adminId, 'camp.registrations', legacy]
    );
    if (!grant) return res.status(403).json({ ok: false, message: 'Registration permission required.' });
    next();
  } catch (err) { next(err); }
});

function normalizeRegistrationFilters(query, targetCampId, includeInstitutionalIds = false) {
  const conditions = ['r.camp_id = ?'];
  const params = [targetCampId];

  if (includeInstitutionalIds) {
    for (const field of ['college_id', 'employee_id']) {
      if (typeof query[field] === 'string' && query[field].trim()) {
        conditions.push(`LOWER(r.${field}) LIKE LOWER(?)`);
        params.push(`%${query[field].trim()}%`);
      }
    }
  }

  // 1. Name search: case-insensitive partial match, trim surrounding whitespace
  if (typeof query.name === 'string' && query.name.trim()) {
    conditions.push('LOWER(r.full_name) LIKE LOWER(?)');
    params.push(`%${query.name.trim()}%`);
  }

  // 2. Registration code search: case-insensitive partial match, trim surrounding whitespace
  if (typeof query.reg_id === 'string' && query.reg_id.trim()) {
    conditions.push('LOWER(r.registration_code) LIKE LOWER(?)');
    params.push(`%${query.reg_id.trim()}%`);
  }

  // 3. General search keyword (if passed)
  if (typeof query.search === 'string' && query.search.trim()) {
    const q = `%${query.search.trim()}%`;
    conditions.push('(LOWER(r.full_name) LIKE LOWER(?) OR LOWER(r.email) LIKE LOWER(?) OR r.mobile LIKE ? OR LOWER(r.registration_code) LIKE LOWER(?) OR LOWER(r.college_id) LIKE LOWER(?) OR LOWER(r.employee_id) LIKE LOWER(?))');
    params.push(q, q, q, q, q, q);
  }

  // 4. Blood group
  if (query.blood_group && query.blood_group !== 'ALL') {
    conditions.push('r.blood_group = ?');
    params.push(query.blood_group);
  }

  // 5. Role / participant_type
  if (query.role && query.role !== 'ALL') {
    conditions.push('r.participant_type = ?');
    params.push(query.role);
  }

  // 6. Branch: case-insensitive partial match
  if (query.branch && query.branch !== 'ALL') {
    conditions.push('LOWER(r.branch) LIKE LOWER(?)');
    params.push(`%${query.branch.trim()}%`);
  }

  // 7. Outcome / Donation Status
  if (query.outcome && query.outcome !== 'ALL') {
    conditions.push('r.outcome = ?');
    params.push(query.outcome);
  }

  // 8. Date Range: Reject if end precedes start
  if (query.date_from && query.date_to && query.date_from > query.date_to) {
    return { error: 'Invalid date range: End date cannot precede start date.' };
  }

  if (query.date_from) {
    conditions.push('DATE(r.created_at) >= ?');
    params.push(query.date_from);
  }

  if (query.date_to) {
    conditions.push('DATE(r.created_at) <= ?');
    params.push(query.date_to);
  }

  return {
    whereClause: conditions.join(' AND '),
    params
  };
}

async function resolveAndVerifyCamp(req, res) {
  const liveId = await getLiveCampId();
  const rawCampId = req.query.camp_id;
  const requestedCampId = rawCampId !== undefined && rawCampId !== null && rawCampId !== '' ? Number(rawCampId) : null;

  let targetCampId = requestedCampId || liveId;

  if (!isSuperAdmin(req)) {
    if (requestedCampId && requestedCampId !== liveId) {
      res.status(403).json({ ok: false, message: 'Access denied: You can only view registrations for the current live camp.' });
      return null;
    }
    targetCampId = liveId;
  }

  if (!targetCampId) {
    res.status(400).json({ ok: false, message: 'Valid camp ID is required.' });
    return null;
  }

  const [[camp]] = await pool.query('SELECT id, camp_year FROM camps WHERE id = ?', [targetCampId]);
  if (!camp) {
    res.status(404).json({ ok: false, message: 'Camp not found.' });
    return null;
  }

  return targetCampId;
}

// ─── GET /api/registrations ── Listing with filters and pagination ───────────
router.get('/', async (req, res, next) => {
  try {
    const targetCampId = await resolveAndVerifyCamp(req, res);
    if (!targetCampId) return;

    const filterResult = normalizeRegistrationFilters(req.query, targetCampId, true);
    if (filterResult.error) {
      return res.status(400).json({ ok: false, message: filterResult.error });
    }

    const { whereClause, params } = filterResult;
    const { page = 1, limit = 25 } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));
    const offset = (pageNum - 1) * limitNum;

    // Count
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM registrations r WHERE ${whereClause}`,
      params
    );

    // Rows
    const [rows] = await pool.query(
      `SELECT r.id, r.camp_id, r.sequence_number, r.registration_code, r.full_name, r.guardian_name,
              r.date_of_birth, r.blood_group, r.email, r.participant_type, r.branch,
              r.college_id, r.employee_id, r.mobile, r.address, r.outcome, r.not_donated_reason,
              r.donated_at, r.created_at
       FROM registrations r
       WHERE ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const formatted = rows.map(r => ({
      ...r,
      role: r.participant_type,
      institutional_id: r.college_id || r.employee_id || null,
      donor_status: r.outcome
    }));

    // Stats for overview (two states: Donated and Not Donated)
    const [[stats]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN outcome = 'DONATED' THEN 1 ELSE 0 END) AS donated,
         SUM(CASE WHEN outcome = 'NOT_DONATED' THEN 1 ELSE 0 END) AS not_donated
       FROM registrations WHERE camp_id = ?`,
      [targetCampId]
    );

    return res.json({
      ok: true,
      success: true,
      data: formatted,
      stats: {
        total: Number(stats?.total || 0),
        donated: Number(stats?.donated || 0),
        not_donated: Number(stats?.not_donated || 0)
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    next(err);
  }
});

// Column definitions for Excel export allowlist
const EXPORT_ALLOWLIST = {
  registration_code: { header: 'Registration Code' },
  full_name: { header: 'Full Name' },
  guardian_name: { header: 'Father/Guardian Name' },
  date_of_birth: { header: 'Date of Birth' },
  blood_group: { header: 'Blood Group' },
  email: { header: 'Email' },
  participant_type: { header: 'Category / Role' },
  branch: { header: 'Branch' },
  college_id: { header: 'College ID' },
  employee_id: { header: 'Employee ID' },
  mobile: { header: 'Mobile Number' },
  address: { header: 'Address' },
  outcome: { header: 'Donation Status' },
  not_donated_reason: { header: 'Not Donated Reason' },
  donated_at: { header: 'Donated At' },
  created_at: { header: 'Registered At' }
};

// ─── GET /api/registrations/export ── Super Admin Excel export with column selection ──
router.get('/export', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Only Super Admins can export registrations.' });
  try {
    const targetCampId = await resolveAndVerifyCamp(req, res);
    if (!targetCampId) return;

    // Validate columns against allowlist
    let selectedColKeys = Object.keys(EXPORT_ALLOWLIST);
    if (req.query.columns !== undefined) {
      const requested = String(req.query.columns || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (requested.some(k => !Object.hasOwn(EXPORT_ALLOWLIST, k))) {
        return res.status(400).json({ ok: false, message: 'Unsupported export column.' });
      }
      const validRequested = [...new Set(requested)];
      if (validRequested.length === 0) {
        return res.status(400).json({
          ok: false,
          message: 'At least one valid column must be selected for export.'
        });
      }
      selectedColKeys = validRequested;
    }

    const filterResult = normalizeRegistrationFilters(req.query, targetCampId);
    if (filterResult.error) {
      return res.status(400).json({ ok: false, message: filterResult.error });
    }

    const { whereClause, params } = filterResult;

    const [rows] = await pool.query(
      `SELECT r.registration_code, r.full_name, r.guardian_name, r.date_of_birth, r.blood_group,
              r.email, r.participant_type, r.branch, r.college_id, r.employee_id, r.mobile,
              r.address, r.outcome, r.not_donated_reason, r.donated_at, r.created_at
       FROM registrations r
       WHERE ${whereClause}
       ORDER BY r.sequence_number ASC`,
      params
    );

    const [[camp]] = await pool.query('SELECT public_title, camp_year FROM camps WHERE id = ?', [targetCampId]);
    const workbook = await createRegistrationWorkbook(rows, selectedColKeys, EXPORT_ALLOWLIST, camp, req.query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bdc_camp_${targetCampId}_registrations.xlsx"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(workbook));
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/registrations/:id/status ── Update donor donation status ───────
async function handleStatusUpdate(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ ok: false, message: 'Valid registration ID is required.' });

    const [[reg]] = await pool.query('SELECT id, camp_id, outcome, registration_code, full_name FROM registrations WHERE id = ?', [id]);
    if (!reg) return res.status(404).json({ ok: false, message: 'Registration record not found.' });

    const liveCampId = await getLiveCampId();
    if (!isSuperAdmin(req) && reg.camp_id !== liveCampId) {
      return res.status(403).json({ ok: false, message: 'Access denied: You can only update records within your active camp boundary.' });
    }

    const rawStatus = req.body.status || req.body.outcome;
    if (!rawStatus) {
      return res.status(400).json({ ok: false, message: 'Status is required.' });
    }

    const normalized = String(rawStatus).toUpperCase().replace(/\s+/g, '_');
    if (!['DONATED', 'NOT_DONATED'].includes(normalized)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid donation status. Allowed statuses are: DONATED, NOT_DONATED'
      });
    }

    // Regular admins can record a donation, but only Super Admins can reverse
    // a previously verified donation.
    if (!isSuperAdmin(req) && reg.outcome === 'DONATED' && normalized === 'NOT_DONATED') {
      return res.status(403).json({
        ok: false,
        message: 'Only a Super Admin can reverse a Donated status.'
      });
    }

    const donatedAt = normalized === 'DONATED' ? new Date() : null;
    const notDonatedReason = normalized === 'NOT_DONATED' ? (req.body.not_donated_reason || req.body.reason || null) : null;

    await pool.query(
      `UPDATE registrations
       SET outcome = ?,
           donated_at = ?,
           not_donated_reason = ?,
           outcome_updated_by = ?,
           outcome_updated_at = NOW(6),
           row_version = row_version + 1
       WHERE id = ?`,
      [normalized, donatedAt, notDonatedReason, req.adminId, id]
    );

    return res.json({
      ok: true,
      success: true,
      message: `Donation status updated to ${normalized === 'DONATED' ? 'Donated' : 'Not Donated'}.`,
      data: {
        id,
        registration_code: reg.registration_code,
        full_name: reg.full_name,
        outcome: normalized,
        donated_at: donatedAt,
        not_donated_reason: notDonatedReason
      }
    });
  } catch (err) {
    next(err);
  }
}

router.patch('/:id/status', handleStatusUpdate);
router.patch('/:id/outcome', handleStatusUpdate);

// ─── PATCH /api/registrations/:id/blood-group ── Super Admin only ───────────
router.patch('/:id/blood-group', async (req, res, next) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ ok: false, message: 'Only a Super Admin can edit blood group.' });
    }
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ ok: false, message: 'Valid registration ID is required.' });
    const allowedBlood = ['A+','A-','B+','B-','AB+','AB-','O+','O-','UNKNOWN'];
    const bloodGroup = String(req.body.blood_group || '').toUpperCase();
    if (!allowedBlood.includes(bloodGroup)) {
      return res.status(400).json({ ok: false, message: 'Please select a valid blood group.' });
    }
    const [[reg]] = await pool.query('SELECT id, registration_code, full_name FROM registrations WHERE id = ?', [id]);
    if (!reg) return res.status(404).json({ ok: false, message: 'Registration record not found.' });
    await pool.query(
      'UPDATE registrations SET blood_group = ?, row_version = row_version + 1 WHERE id = ?',
      [bloodGroup, id]
    );
    return res.json({ ok: true, success: true, message: 'Blood group updated successfully.', data: { id, blood_group: bloodGroup } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/registrations/:id ── Single registration detail ────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [[r]] = await pool.query(
      `SELECT r.id, r.camp_id, r.sequence_number, r.registration_code, r.full_name, r.guardian_name,
              r.date_of_birth, r.blood_group, r.email, r.participant_type, r.branch,
              r.college_id, r.employee_id, r.mobile, r.address, r.outcome, r.not_donated_reason,
              r.donated_at, r.created_at, c.public_title AS camp_title
       FROM registrations r
       JOIN camps c ON c.id = r.camp_id
       WHERE r.id = ?`,
      [id]
    );

    if (!r) return res.status(404).json({ ok: false, message: 'Registration not found.' });

    const liveId = await getLiveCampId();
    if (!isSuperAdmin(req) && r.camp_id !== liveId) {
      return res.status(403).json({ ok: false, message: 'Access restricted to current live camp.' });
    }

    return res.json({
      ok: true,
      success: true,
      data: {
        ...r,
        role: r.participant_type,
        institutional_id: r.college_id || r.employee_id || null
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── POLICY: No DELETE route for registrations ───────────────────────────────
// Registration records are permanent once a donor submits their registration
// on the public website. They CANNOT be deleted through the admin panel or
// any API endpoint by design — this protects data integrity and audit history.
//
// To remove a registration (e.g. test records during setup), use a direct SQL
// query on the database after confirming with the Super Admin. Example:
//
//   DELETE FROM registration_attempts WHERE registration_id = <id>;
//   DELETE FROM registrations WHERE id = <id>;
//
// DO NOT add a DELETE /api/registrations/:id route here.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;

