'use strict';
const express     = require('express');
const { pool }    = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

const isSuperAdmin = (req) => req.adminRole === 'SUPER_ADMIN';

async function verifyCampAccess(req, res, campId) {
  if (isSuperAdmin(req)) return true;
  const [[grant]] = await pool.query('SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?', [req.adminId, 'camp.sponsors']);
  if (!grant) { res.status(403).json({ ok: false, message: 'Module permission required.' }); return false; }
  const [[state]] = await pool.query('SELECT live_camp_id FROM site_state WHERE id = 1');
  if (state?.live_camp_id !== Number(campId)) {
    res.status(403).json({ ok: false, message: 'Access restricted to the current live camp.' });
    return false;
  }
  return true;
}

// ─── GET /api/camps/:campId/sponsors ─────────────────────────────────────────
router.get('/:campId/sponsors', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    if (!campId || isNaN(campId)) return res.status(400).json({ ok: false, message: 'Valid numeric campId is required.' });
    if (!(await verifyCampAccess(req, res, campId))) return;

    // Load sections
    const [sections] = await pool.query(
      'SELECT id, camp_id, heading, description, is_visible, sort_order FROM sponsor_sections WHERE camp_id = ? ORDER BY sort_order, id',
      [campId]
    );

    // Load sponsors for all sections of this camp
    const [sponsors] = await pool.query(
      `SELECT s.id, s.section_id, s.name, s.logo_asset_id, s.logo_alt, s.website_url, s.is_visible, s.sort_order,
              a.relative_path AS logo_path
       FROM sponsors s
       JOIN sponsor_sections sec ON sec.id = s.section_id
       LEFT JOIN media_assets a ON a.id = s.logo_asset_id
       WHERE sec.camp_id = ?
       ORDER BY s.sort_order, s.id`,
      [campId]
    );

    const spMap = {};
    for (const sp of sponsors) {
      if (!spMap[sp.section_id]) spMap[sp.section_id] = [];
      spMap[sp.section_id].push({
        id: sp.id,
        section_id: sp.section_id,
        name: sp.name,
        logo_asset_id: sp.logo_asset_id,
        logo_alt: sp.logo_alt,
        logo_url: sp.logo_path ? `/media/${sp.logo_path}` : null,
        website_url: sp.website_url,
        is_visible: Boolean(sp.is_visible),
        sort_order: sp.sort_order
      });
    }

    const data = sections.map(sec => ({
      id: sec.id,
      camp_id: sec.camp_id,
      heading: sec.heading,
      description: sec.description,
      is_visible: Boolean(sec.is_visible),
      sort_order: sec.sort_order,
      sponsors: spMap[sec.id] || []
    }));

    return res.json({ ok: true, success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/camps/:campId/sponsors/sections ───────────────────────────────
router.post('/:campId/sponsors/sections', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    if (!(await verifyCampAccess(req, res, campId))) return;

    const { heading, description, is_visible, sort_order } = req.body;
    if (!heading) return res.status(400).json({ ok: false, message: 'heading is required.' });

    const [result] = await pool.query(
      `INSERT INTO sponsor_sections (camp_id, heading, description, is_visible, sort_order, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [campId, heading.trim(), description?.trim() || null, is_visible !== false ? 1 : 0, sort_order || 0, req.adminId, req.adminId]
    );

    return res.status(201).json({ ok: true, success: true, id: result.insertId, message: 'Section created.' });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/camps/:campId/sponsors/sections/:id ──────────────────────────
router.patch('/:campId/sponsors/sections/:id', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    const id     = Number(req.params.id);
    if (!(await verifyCampAccess(req, res, campId))) return;

    const allowed = ['heading', 'description', 'is_visible', 'sort_order'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (typeof updates.is_visible === 'boolean') updates.is_visible = updates.is_visible ? 1 : 0;
    if (!Object.keys(updates).length) return res.status(400).json({ ok: false, message: 'Nothing to update.' });

    updates.updated_by = req.adminId;
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE sponsor_sections SET ${setClauses} WHERE id = ? AND camp_id = ?`, [...Object.values(updates), id, campId]);

    return res.json({ ok: true, success: true, message: 'Section updated.' });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/camps/:campId/sponsors/sections/:id ─────────────────────────
router.delete('/:campId/sponsors/sections/:id', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    const id     = Number(req.params.id);
    if (!(await verifyCampAccess(req, res, campId))) return;

    const [[section]] = await pool.query('SELECT id FROM sponsor_sections WHERE id = ? AND camp_id = ?', [id, campId]);
    if (!section) {
      return res.status(404).json({ ok: false, message: 'Section not found for this camp.' });
    }

    const reassignId = Number(req.query.reassign_to_section_id || req.body?.reassign_to_section_id);
    if (reassignId) {
      if (reassignId === id) {
        return res.status(400).json({ ok: false, message: 'Cannot reassign sponsors to the section being deleted.' });
      }
      const [[targetSec]] = await pool.query('SELECT id FROM sponsor_sections WHERE id = ? AND camp_id = ?', [reassignId, campId]);
      if (!targetSec) {
        return res.status(400).json({ ok: false, message: 'Target section for reassignment does not belong to this camp.' });
      }
      await pool.query('UPDATE sponsors SET section_id = ? WHERE section_id = ?', [reassignId, id]);
    }

    // Foreign key with ON DELETE CASCADE cascades to remaining sponsors in this section
    await pool.query('DELETE FROM sponsor_sections WHERE id = ? AND camp_id = ?', [id, campId]);
    return res.json({ ok: true, success: true, message: reassignId ? 'Section removed and sponsors reassigned.' : 'Section and its sponsors removed.' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/camps/:campId/sponsors ────────────────────────────────────────
router.post('/:campId/sponsors', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    if (!(await verifyCampAccess(req, res, campId))) return;

    const { section_id, name, logo_asset_id, logo_alt, website_url, is_visible, sort_order } = req.body;
    if (!section_id || !name || !name.trim()) {
      return res.status(400).json({ ok: false, message: 'section_id and name are required.' });
    }

    const [[sec]] = await pool.query('SELECT id FROM sponsor_sections WHERE id = ? AND camp_id = ?', [Number(section_id), campId]);
    if (!sec) {
      return res.status(404).json({ ok: false, message: 'Section not found for this camp.' });
    }

    const [result] = await pool.query(
      `INSERT INTO sponsors (section_id, name, logo_asset_id, logo_alt, website_url, is_visible, sort_order, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(section_id),
        name.trim(),
        logo_asset_id || null,
        logo_alt?.trim() || null,
        website_url?.trim() || null,
        is_visible !== false ? 1 : 0,
        sort_order || 0,
        req.adminId,
        req.adminId
      ]
    );

    return res.status(201).json({ ok: true, success: true, id: result.insertId, message: 'Sponsor added.' });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/camps/:campId/sponsors/:id ───────────────────────────────────
router.patch('/:campId/sponsors/:id', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    const id     = Number(req.params.id);
    if (!(await verifyCampAccess(req, res, campId))) return;

    const [[sp]] = await pool.query(
      'SELECT s.id, s.section_id FROM sponsors s JOIN sponsor_sections sec ON sec.id = s.section_id WHERE s.id = ? AND sec.camp_id = ?',
      [id, campId]
    );
    if (!sp) {
      return res.status(404).json({ ok: false, message: 'Sponsor not found for this camp.' });
    }

    const allowed = ['section_id', 'name', 'logo_asset_id', 'logo_alt', 'website_url', 'is_visible', 'sort_order'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (updates.section_id !== undefined) {
      const [[targetSec]] = await pool.query('SELECT id FROM sponsor_sections WHERE id = ? AND camp_id = ?', [Number(updates.section_id), campId]);
      if (!targetSec) {
        return res.status(400).json({ ok: false, message: 'Target section does not belong to this camp.' });
      }
    }
    if (typeof updates.name === 'string') updates.name = updates.name.trim();
    if (typeof updates.is_visible === 'boolean') updates.is_visible = updates.is_visible ? 1 : 0;
    if (!Object.keys(updates).length) return res.status(400).json({ ok: false, message: 'Nothing to update.' });

    updates.updated_by = req.adminId;
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE sponsors SET ${setClauses} WHERE id = ?`, [...Object.values(updates), id]);

    return res.json({ ok: true, success: true, message: 'Sponsor updated.' });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/camps/:campId/sponsors/:id ──────────────────────────────────
router.delete('/:campId/sponsors/:id', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    const id     = Number(req.params.id);
    if (!(await verifyCampAccess(req, res, campId))) return;

    const [[sp]] = await pool.query(
      'SELECT s.id FROM sponsors s JOIN sponsor_sections sec ON sec.id = s.section_id WHERE s.id = ? AND sec.camp_id = ?',
      [id, campId]
    );
    if (!sp) {
      return res.status(404).json({ ok: false, message: 'Sponsor not found for this camp.' });
    }

    await pool.query('DELETE FROM sponsors WHERE id = ?', [id]);
    return res.json({ ok: true, success: true, message: 'Sponsor removed.' });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/camps/:campId/sponsors/reorder-sections ────────────────────────
router.put('/:campId/sponsors/reorder-sections', require('../reorder')('sections'));

// ─── PUT /api/camps/:campId/sponsors/reorder-sponsors ────────────────────────
router.put('/:campId/sponsors/reorder-sponsors', require('../reorder')('sponsors'));

module.exports = router;
