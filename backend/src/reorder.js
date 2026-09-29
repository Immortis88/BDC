'use strict';
const { pool } = require('./db');

// Each request must describe the entire scope, never an arbitrary subset of IDs.
module.exports = function reorder(kind) {
  return async (req, res, next) => {
    const campId = Number(req.params.campId);
    const { orderedIds, groupKey, sectionId, previousIds } = req.body;
    const invalid = message => res.status(400).json({ ok: false, message });
    if (!Number.isSafeInteger(campId) || campId < 1) return invalid('Invalid camp.');
    if (!Array.isArray(orderedIds) || orderedIds.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(orderedIds).size !== orderedIds.length) return invalid('Provide unique numeric record IDs.');
    if (kind === 'team' && !['CHIEF_COORDINATOR', 'MEMBERS', 'STUDENT_COORDINATORS'].includes(groupKey)) return invalid('Choose an editable roster group. Website Team is locked.');
    if (kind === 'sponsors' && (!Number.isSafeInteger(sectionId) || sectionId < 1)) return invalid('Choose a sponsor section.');
    const moduleKey = kind === 'sections' ? 'sponsors' : kind;
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.beginTransaction();
      if (req.adminRole !== 'SUPER_ADMIN') {
        const [[grant]] = await conn.query('SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?', [req.adminId, `camp.${moduleKey}`]);
        const [[state]] = await conn.query('SELECT live_camp_id FROM site_state WHERE id = 1');
        if (!grant || Number(state?.live_camp_id) !== campId) {
          await conn.rollback();
          return res.status(403).json({ ok: false, message: 'No permission to reorder this camp module.' });
        }
      }
      // Serialize mutations of all ordering scopes in this camp.
      const [[camp]] = await conn.query('SELECT id FROM camps WHERE id = ? FOR UPDATE', [campId]);
      if (!camp) { await conn.rollback(); return invalid('Camp not found.'); }
      const table = { team: 'team_members', gallery: 'gallery_photos', sections: 'sponsor_sections', sponsors: 'sponsors' }[kind];
      let where = 'camp_id = ?', params = [campId];
      if (kind === 'team') { where += ' AND group_key = ?'; params.push(groupKey); }
      if (kind === 'sponsors') {
        const [[section]] = await conn.query('SELECT id FROM sponsor_sections WHERE id = ? AND camp_id = ?', [sectionId, campId]);
        if (!section) { await conn.rollback(); return invalid('Section does not belong to this camp.'); }
        where = 'section_id = ?'; params = [sectionId];
      }
      const [rows] = await conn.query(`SELECT id FROM ${table} WHERE ${where} ORDER BY sort_order, id FOR UPDATE`, params);
      const ids = rows.map(row => Number(row.id));
      if (ids.length !== orderedIds.length || orderedIds.some(id => !ids.includes(id))) {
        await conn.rollback(); return invalid('Order must contain every record in this camp and group exactly once. Refresh and retry.');
      }
      if (previousIds && JSON.stringify(previousIds) !== JSON.stringify(ids)) {
        await conn.rollback(); return res.status(409).json({ ok: false, message: 'Order changed elsewhere. Refresh before reordering.' });
      }
      for (let i = 0; i < orderedIds.length; i++) await conn.query(`UPDATE ${table} SET sort_order = ? WHERE id = ?`, [i + 1, orderedIds[i]]);
      await conn.commit();
      res.json({ ok: true, success: true });
    } catch (error) { if (conn) await conn.rollback(); next(error); }
    finally { if (conn) conn.release(); }
  };
};
