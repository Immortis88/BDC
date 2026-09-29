'use strict';
const express       = require('express');
const crypto        = require('crypto');
const fs            = require('fs');
const path          = require('path');
const { pool }      = require('../db');
const requireAuth   = require('../middleware/requireAuth');

const router = express.Router();
router.use(requireAuth);

const isSuperAdmin = (req) => req.adminRole === 'SUPER_ADMIN';

async function getLiveCampId() {
  const [[row]] = await pool.query('SELECT live_camp_id FROM site_state WHERE id = 1');
  return row?.live_camp_id ?? null;
}

// ─── GET /api/camps ───────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const liveId = await getLiveCampId();
    let rows;
    if (isSuperAdmin(req)) {
      [rows] = await pool.query(
        'SELECT id, camp_year, internal_name, public_title, camp_date, starts_at, ends_at, venue, venue_subtitle, description, registration_open, storage_state, media_folder, created_at FROM camps WHERE deleted_at IS NULL ORDER BY camp_year DESC'
      );
    } else {
      if (!liveId) return res.json({ ok: true, data: [], liveCampId: null });
      [rows] = await pool.query(
        'SELECT id, camp_year, internal_name, public_title, camp_date, starts_at, ends_at, venue, venue_subtitle, description, registration_open, storage_state, media_folder, created_at FROM camps WHERE id = ? AND deleted_at IS NULL',
        [liveId]
      );
    }
    return res.json({
      ok: true,
      success: true,
      data: rows,
      liveCampId: liveId
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/camps/site-state ────────────────────────────────────────────────
router.get('/site-state', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT live_camp_id, version FROM site_state WHERE id = 1');
    return res.json({ ok: true, live_camp_id: row.live_camp_id, version: row.version });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/camps/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const campId = Number(req.params.id);
    const liveId = await getLiveCampId();

    if (!isSuperAdmin(req) && liveId !== campId) {
      return res.status(403).json({ ok: false, message: 'Access restricted to current live camp.' });
    }

    const [[camp]] = await pool.query(
      'SELECT id, camp_year, internal_name, public_title, camp_date, starts_at, ends_at, venue, venue_subtitle, description, registration_open, storage_state, media_folder FROM camps WHERE id = ? AND deleted_at IS NULL',
      [campId]
    );
    if (!camp) return res.status(404).json({ ok: false, message: 'Camp not found.' });

    // Page visibility
    const [vis] = await pool.query(
      'SELECT page_key, is_visible FROM camp_page_visibility WHERE camp_id = ?',
      [campId]
    );
    const visibility = { team: true, sponsors: true, registration: true };
    for (const v of vis) {
      visibility[v.page_key] = Boolean(v.is_visible);
    }

    return res.json({
      ok: true,
      success: true,
      data: camp,
      isLive: liveId === camp.id,
      visibility
    });
  } catch (err) {
    next(err);
  }
});

function normalizeTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const str = timeStr.trim();
  const match24WithSec = str.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (match24WithSec) {
    const h = parseInt(match24WithSec[1], 10);
    const m = parseInt(match24WithSec[2], 10);
    const s = parseInt(match24WithSec[3], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
  }
  const match24 = str.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    }
  }
  const match12 = str.match(/^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2] ? parseInt(match12[2], 10) : 0;
    const s = match12[3] ? parseInt(match12[3], 10) : 0;
    const isPm = match12[4].toLowerCase() === 'pm';
    if (h < 1 || h > 12 || m < 0 || m >= 60 || s < 0 || s >= 60) return null;
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return null;
}

function normalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 1990 || year > 2199 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

// ─── POST /api/camps ──────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  try {
    const {
      camp_year,
      internal_name,
      public_title,
      description,
      camp_date,
      starts_at,
      ends_at,
      venue,
      venue_subtitle
    } = req.body;

    // Reject obsolete copy parameters with 400
    if (
      req.body.copyFromCampId !== undefined ||
      req.body.copyTeam !== undefined ||
      req.body.copySponsors !== undefined ||
      req.body.copyGallery !== undefined
    ) {
      return res.status(400).json({
        ok: false,
        message: 'Copying team, sponsors, or gallery from another camp is not permitted. New camps must always start with empty records.'
      });
    }

    const year = Number(camp_year);
    if (!year || year < 1990 || year > 2199) {
      return res.status(400).json({ ok: false, message: 'Valid camp year between 1990 and 2199 is required.' });
    }
    if (!internal_name?.trim() || !public_title?.trim() || !venue?.trim()) {
      return res.status(400).json({ ok: false, message: 'Missing required camp information fields (name, title, venue).' });
    }

    const normDate = normalizeDate(camp_date);
    if (!normDate) {
      return res.status(400).json({ ok: false, message: 'Invalid calendar date. Camp date must be a valid date in YYYY-MM-DD format.' });
    }

    const normStarts = normalizeTime(starts_at);
    if (!normStarts) {
      return res.status(400).json({ ok: false, message: 'Invalid start time format (e.g. 09:00 or 9:00 AM).' });
    }

    const normEnds = normalizeTime(ends_at);
    if (!normEnds) {
      return res.status(400).json({ ok: false, message: 'Invalid end time format (e.g. 16:00 or 4:00 PM).' });
    }

    if (normEnds <= normStarts) {
      return res.status(400).json({ ok: false, message: 'End time must be after start time.' });
    }

    const mediaFolder = `BDC Camp ${year}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO camps (camp_year, internal_name, public_title, description, camp_date, starts_at, ends_at, venue, venue_subtitle, registration_open, media_folder, storage_state, created_by, updated_by)
         VALUES (?,?,?,?,?,?,?,?,?,FALSE,?,'READY',?,?)`,
        [year, internal_name.trim(), public_title.trim(), description?.trim() || null, normDate, normStarts, normEnds, venue.trim(), venue_subtitle?.trim() || null, mediaFolder, req.adminId, req.adminId]
      );
      const newId = result.insertId;

      // Seed initial visibility (team, sponsors, registration)
      const pages = [
        { key: 'team', visible: 1 },
        { key: 'sponsors', visible: 1 },
        { key: 'registration', visible: 0 }
      ];
      for (const p of pages) {
        await conn.query(
          'INSERT INTO camp_page_visibility (camp_id, page_key, is_visible, updated_by) VALUES (?,?,?,?)',
          [newId, p.key, p.visible, req.adminId]
        );
      }

      // Seed registration sequence counter
      await conn.query('INSERT INTO registration_counters (camp_id, next_sequence) VALUES (?, 1)', [newId]);

      await conn.commit();
      return res.status(201).json({
        ok: true,
        success: true,
        id: newId,
        message: `Camp BDC ${year} created successfully.`
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, message: 'A camp record for that year already exists.' });
    }
    next(err);
  }
});

// ─── PATCH /api/camps/:id ─────────────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const campId = Number(req.params.id);
    const liveId = await getLiveCampId();

    if (!isSuperAdmin(req)) {
      if (liveId !== campId) {
        return res.status(403).json({ ok: false, message: 'Access restricted to current live camp.' });
      }
      const [[grant]] = await pool.query(
        'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = "camp.overview"',
        [req.adminId]
      );
      if (!grant) {
        return res.status(403).json({ ok: false, message: 'Access denied: camp.overview permission required.' });
      }
    }

    const [[existingCamp]] = await pool.query('SELECT * FROM camps WHERE id = ?', [campId]);
    if (!existingCamp) {
      return res.status(404).json({ ok: false, message: 'Camp not found.' });
    }

    const updates = {};

    if ('public_title' in req.body) {
      const val = req.body.public_title?.trim();
      if (!val) return res.status(400).json({ ok: false, message: 'Public title cannot be empty.' });
      updates.public_title = val;
    }

    if ('internal_name' in req.body) {
      const val = req.body.internal_name?.trim();
      if (!val) return res.status(400).json({ ok: false, message: 'Internal reference name cannot be empty.' });
      updates.internal_name = val;
    }

    if ('venue' in req.body) {
      const val = req.body.venue?.trim();
      if (!val) return res.status(400).json({ ok: false, message: 'Venue cannot be empty.' });
      updates.venue = val;
    }

    if ('venue_subtitle' in req.body) {
      updates.venue_subtitle = req.body.venue_subtitle?.trim() || null;
    }

    if ('description' in req.body) {
      updates.description = req.body.description?.trim() || null;
    }

    if ('camp_date' in req.body) {
      const normDate = normalizeDate(req.body.camp_date);
      if (!normDate) {
        return res.status(400).json({ ok: false, message: 'Invalid calendar date. Camp date must be a valid date in YYYY-MM-DD format.' });
      }
      updates.camp_date = normDate;
    }

    let finalStartsAt = existingCamp.starts_at;
    let finalEndsAt = existingCamp.ends_at;

    if ('starts_at' in req.body) {
      const normStarts = normalizeTime(req.body.starts_at);
      if (!normStarts) {
        return res.status(400).json({ ok: false, message: 'Invalid start time format (e.g. 09:00 or 9:00 AM).' });
      }
      updates.starts_at = normStarts;
      finalStartsAt = normStarts;
    }

    if ('ends_at' in req.body) {
      const normEnds = normalizeTime(req.body.ends_at);
      if (!normEnds) {
        return res.status(400).json({ ok: false, message: 'Invalid end time format (e.g. 16:00 or 4:00 PM).' });
      }
      updates.ends_at = normEnds;
      finalEndsAt = normEnds;
    }

    if (('starts_at' in req.body || 'ends_at' in req.body) && finalEndsAt <= finalStartsAt) {
      return res.status(400).json({ ok: false, message: 'End time must be after start time.' });
    }

    if ('registration_open' in req.body) {
      updates.registration_open = Boolean(req.body.registration_open) ? 1 : 0;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ ok: false, message: 'Nothing to update.' });
    }

    updates.updated_by = req.adminId;

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values     = [...Object.values(updates), campId];
    await pool.query(`UPDATE camps SET ${setClauses} WHERE id = ?`, values);

    const [[updatedCamp]] = await pool.query(
      'SELECT id, camp_year, internal_name, public_title, camp_date, starts_at, ends_at, venue, venue_subtitle, description, registration_open, storage_state, media_folder, created_at, updated_at FROM camps WHERE id = ? AND deleted_at IS NULL',
      [campId]
    );

    return res.json({
      ok: true,
      success: true,
      message: 'Camp updated successfully.',
      data: updatedCamp
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/camps/:id ── Soft-delete camp (Super Admin only) ────────────
router.delete('/:id', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Only a Super Admin can delete camps.' });
  try {
    const campId = Number(req.params.id);
    if (!campId || isNaN(campId)) return res.status(400).json({ ok: false, message: 'Valid camp ID is required.' });
    const liveId = await getLiveCampId();
    if (liveId === campId) {
      return res.status(400).json({ ok: false, message: 'Switch to another camp or clear the live camp before deleting this camp.' });
    }
    const [[camp]] = await pool.query('SELECT id, public_title, deleted_at FROM camps WHERE id = ?', [campId]);
    if (!camp) return res.status(404).json({ ok: false, message: 'Camp not found.' });
    if (camp.deleted_at) return res.status(410).json({ ok: false, message: 'Camp has already been archived.' });
    await pool.query(
      'UPDATE camps SET deleted_at = NOW(6), registration_open = FALSE, updated_by = ? WHERE id = ?',
      [req.adminId, campId]
    );
    return res.json({ ok: true, success: true, message: 'Camp archived. Its registrations and related data remain stored safely.', data: { id: campId } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/camps/:id/set-live ─────────────────────────────────────────────
// Atomically: close outgoing registration, switch pointer, bump version.
router.post('/:id/set-live', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  try {
    const newCampId = Number(req.params.id);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[state]] = await conn.query('SELECT live_camp_id, version FROM site_state WHERE id = 1 FOR UPDATE');
      const outgoingId = state.live_camp_id;

      // Close outgoing camp registration
      if (outgoingId && outgoingId !== newCampId) {
        await conn.query('UPDATE camps SET registration_open = FALSE, updated_by = ? WHERE id = ?', [req.adminId, outgoingId]);
      }
      // Switch pointer
      await conn.query(
        'UPDATE site_state SET live_camp_id = ?, version = version + 1, updated_by = ?, updated_at = NOW(6) WHERE id = 1',
        [newCampId, req.adminId]
      );
      await conn.commit();
      return res.json({ ok: true, success: true, message: 'Live camp updated.', live_camp_id: newCampId });
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

// ─── POST /api/camps/clear-live ───────────────────────────────────────────────
router.post('/clear-live', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[state]] = await conn.query('SELECT live_camp_id FROM site_state WHERE id = 1 FOR UPDATE');
      if (state.live_camp_id) {
        await conn.query('UPDATE camps SET registration_open = FALSE, updated_by = ? WHERE id = ?', [req.adminId, state.live_camp_id]);
      }
      await conn.query('UPDATE site_state SET live_camp_id = NULL, version = version + 1, updated_by = ?, updated_at = NOW(6) WHERE id = 1', [req.adminId]);
      await conn.commit();
      return res.json({ ok: true, success: true, message: 'Live camp cleared.' });
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

// ─── PATCH /api/camps/:id/visibility ─────────────────────────────────────────
router.patch('/:id/visibility', async (req, res, next) => {
  try {
    const campId  = Number(req.params.id);
    const liveId = await getLiveCampId();

    if (!isSuperAdmin(req)) {
      if (liveId !== campId) {
        return res.status(403).json({ ok: false, message: 'Access restricted to current live camp.' });
      }
      const [[grant]] = await pool.query(
        'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = "camp.overview"',
        [req.adminId]
      );
      if (!grant) {
        return res.status(403).json({ ok: false, message: 'Access denied: camp.overview permission required.' });
      }
    }

    const { page_key, is_visible } = req.body;
    const allowed = ['team','sponsors','registration'];
    if (!allowed.includes(page_key)) return res.status(400).json({ ok: false, message: 'Invalid page_key.' });

    const [[camp]] = await pool.query('SELECT id FROM camps WHERE id = ?', [campId]);
    if (!camp) return res.status(404).json({ ok: false, message: 'Camp not found.' });

    await pool.query(
      'INSERT INTO camp_page_visibility (camp_id, page_key, is_visible, updated_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE is_visible = VALUES(is_visible), updated_by = VALUES(updated_by)',
      [campId, page_key, is_visible ? 1 : 0, req.adminId]
    );
    const [rows] = await pool.query(
      'SELECT page_key, is_visible FROM camp_page_visibility WHERE camp_id = ?',
      [campId]
    );
    const visibility = { team: true, sponsors: true, registration: true };
    for (const row of rows) visibility[row.page_key] = Boolean(row.is_visible);
    return res.json({ ok: true, success: true, visibility });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
