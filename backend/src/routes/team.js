'use strict';
const express     = require('express');
const { pool }    = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { getTeamSections, validateSection } = require('../teamSections');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);
router.use(async (req, res, next) => {
  if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) return next();
  try {
    const match = req.path.match(/^\/(\d+)\/team(?:\/(\d+))?$/);
    if (!match) return next();
    if (req.body?.group_key === 'WEBSITE_TEAM') return res.status(403).json({ ok: false, message: 'Website Team is permanent and locked.' });
    if (match[2]) {
      const [[row]] = await pool.query('SELECT group_key FROM team_members WHERE id = ? AND camp_id = ?', [match[2], match[1]]);
      if (!row) return res.status(404).json({ ok: false, message: 'Member not found in this camp.' });
      if (row.group_key === 'WEBSITE_TEAM') return res.status(403).json({ ok: false, message: 'Website Team is permanent and locked.' });
    }
    next();
  } catch (error) { next(error); }
});

const isSuperAdmin = (req) => req.adminRole === 'SUPER_ADMIN';

async function verifyCampAccess(req, res, campId) {
  if (isSuperAdmin(req)) return true;
  const [[grant]] = await pool.query('SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?', [req.adminId, 'camp.team']);
  if (!grant) { res.status(403).json({ ok: false, message: 'Module permission required.' }); return false; }
  const [[state]] = await pool.query('SELECT live_camp_id FROM site_state WHERE id = 1');
  if (state?.live_camp_id !== Number(campId)) {
    res.status(403).json({ ok: false, message: 'Access restricted to the current live camp.' });
    return false;
  }
  return true;
}

// ─── GET /api/camps/:campId/team ─────────────────────────────────────────────
router.get('/:campId/team', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    if (!campId || isNaN(campId)) return res.status(400).json({ ok: false, message: 'Valid numeric campId is required.' });
    if (!(await verifyCampAccess(req, res, campId))) return;

    const [rows] = await pool.query(
      `SELECT t.id, t.camp_id, t.group_key, t.full_name, t.role_label, t.phone, t.email,
              t.photo_asset_id, t.photo_alt, t.show_phone_publicly, t.is_visible, t.sort_order,
              a.relative_path AS photo_path
       FROM team_members t
       LEFT JOIN media_assets a ON a.id = t.photo_asset_id
       WHERE t.camp_id = ? AND t.group_key <> 'WEBSITE_TEAM'
       ORDER BY t.group_key, t.sort_order, t.id`,
      [campId]
    );

    const formatted = rows.map(r => ({
      id: r.id,
      camp_id: r.camp_id,
      group_key: r.group_key,
      full_name: r.full_name,
      role_label: r.role_label,
      phone: r.phone,
      email: r.email,
      photo_asset_id: r.photo_asset_id,
      photo_alt: r.photo_alt,
      photo_url: r.photo_path ? `/media/${r.photo_path}` : null,
      show_phone_publicly: Boolean(r.show_phone_publicly),
      is_visible: Boolean(r.is_visible),
      sort_order: r.sort_order
    }));

    const sections = await getTeamSections(pool, campId);
    return res.json({ ok: true, success: true, data: formatted, sections });
  } catch (err) {
    next(err);
  }
});

router.patch('/:campId/team/sections/:key', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    if (!Number.isSafeInteger(campId) || campId <= 0) return res.status(400).json({ ok: false, message: 'Valid numeric campId is required.' });
    if (!(await verifyCampAccess(req, res, campId))) return;
    const error = validateSection(req.params.key, req.body || {});
    if (error) return res.status(400).json({ ok: false, message: error });
    const [[camp]] = await pool.query('SELECT id FROM camps WHERE id = ?', [campId]);
    if (!camp) return res.status(404).json({ ok: false, message: 'Camp not found.' });
    const heading = req.body.heading.trim();
    const description = req.body.description.trim();
    await pool.query(
      `INSERT INTO team_sections (camp_id, group_key, heading, description) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE heading = VALUES(heading), description = VALUES(description)`,
      [campId, req.params.key, heading, description]
    );
    return res.json({ ok: true, success: true, data: { key: req.params.key, label: heading, desc: description } });
  } catch (err) { next(err); }
});

// ─── POST /api/camps/:campId/team ────────────────────────────────────────────
router.post('/:campId/team', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    if (!(await verifyCampAccess(req, res, campId))) return;

    const {
      group_key,
      full_name,
      role_label,
      phone,
      email,
      photo_asset_id,
      photo_alt,
      show_phone_publicly,
      is_visible,
      sort_order
    } = req.body;

    if (!group_key || !full_name || !full_name.trim()) {
      return res.status(400).json({ ok: false, message: 'group_key and full_name are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO team_members (camp_id, group_key, full_name, role_label, phone, email, photo_asset_id, photo_alt, show_phone_publicly, is_visible, sort_order, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campId,
        group_key,
        full_name.trim(),
        (role_label || '').trim(),
        phone?.trim() || null,
        email?.trim() || null,
        photo_asset_id || null,
        photo_alt?.trim() || null,
        show_phone_publicly ? 1 : 0,
        is_visible !== false ? 1 : 0,
        sort_order || 0,
        req.adminId,
        req.adminId
      ]
    );

    return res.status(201).json({ ok: true, success: true, id: result.insertId, message: 'Team member added.' });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/camps/:campId/team/:id ───────────────────────────────────────
router.patch('/:campId/team/:id', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    const id     = Number(req.params.id);
    if (!(await verifyCampAccess(req, res, campId))) return;

    const allowed = ['group_key','full_name','role_label','phone','photo_asset_id','photo_alt','show_phone_publicly','is_visible','sort_order'];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) { updates[k] = (k === 'role_label' || k === 'full_name') ? (req.body[k] || '').trim() : req.body[k]; }
    }
    if (typeof updates.show_phone_publicly === 'boolean') updates.show_phone_publicly = updates.show_phone_publicly ? 1 : 0;
    if (typeof updates.is_visible === 'boolean') updates.is_visible = updates.is_visible ? 1 : 0;

    if (!Object.keys(updates).length) return res.status(400).json({ ok: false, message: 'Nothing to update.' });
    updates.updated_by = req.adminId;

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE team_members SET ${setClauses} WHERE id = ? AND camp_id = ?`, [...Object.values(updates), id, campId]);

    return res.json({ ok: true, success: true, message: 'Team member updated.' });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/camps/:campId/team/:id ─────────────────────────────────────
router.delete('/:campId/team/:id', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    const id     = Number(req.params.id);
    if (!(await verifyCampAccess(req, res, campId))) return;

    await pool.query('DELETE FROM team_members WHERE id = ? AND camp_id = ?', [id, campId]);
    return res.json({ ok: true, success: true, message: 'Team member removed.' });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/camps/:campId/team/reorder ─────────────────────────────────────
router.put('/:campId/team/reorder', require('../reorder')('team'));

module.exports = router;
