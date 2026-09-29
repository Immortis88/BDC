'use strict';
const express     = require('express');
const { pool }    = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const isSuperAdmin = (req) => req.adminRole === 'SUPER_ADMIN';

const AREA_PERMS = {
  HOMEPAGE:          'website.homepage',
  ABOUT:             'website.about',
  NOTICES:           'website.notices',
  FAQ:               'website.faq',
  CONTACT:           'website.contact',
  PAGES:             'website.pages',
  REGISTRATION_TEXT: 'website.registration_text'
};

async function checkAreaPermission(req, res, area) {
  if (isSuperAdmin(req)) return true;
  const requiredPerm = AREA_PERMS[area];
  if (!requiredPerm) {
    res.status(400).json({ ok: false, message: 'Invalid CMS area.' });
    return false;
  }
  const [[grant]] = await pool.query(
    'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?',
    [req.adminId, requiredPerm]
  );
  if (!grant) {
    res.status(403).json({ ok: false, message: `Missing required permission: ${requiredPerm}` });
    return false;
  }
  return true;
}

// ─── GET /api/cms/:area/draft ── Load draft or published fallback ────────────
router.get('/:area/draft', requireAuth, async (req, res, next) => {
  try {
    const area = req.params.area.toUpperCase();
    if (!(await checkAreaPermission(req, res, area))) return;

    const [[pub]] = await pool.query('SELECT * FROM cms_publications WHERE area = ?', [area]);
    if (!pub) return res.status(404).json({ ok: false, message: 'Area not found.' });

    let activeRevisionId = pub.draft_revision_id || pub.published_revision_id;
    let hasUnpublishedDraft = Boolean(pub.draft_revision_id);

    if (!activeRevisionId) {
      return res.json({ ok: true, success: true, payload: null, hasDraft: false, publishedAt: null });
    }

    const [[rev]] = await pool.query('SELECT payload, revision_number FROM cms_revisions WHERE id = ?', [activeRevisionId]);

    let payload = rev.payload;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch { /* keep as is */ }
    }

    return res.json({
      ok: true,
      success: true,
      area,
      payload,
      hasDraft: hasUnpublishedDraft,
      revisionNumber: rev.revision_number,
      publishedAt: pub.published_at
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/cms/:area/draft ── Save Draft ─────────────────────────────────
router.post('/:area/draft', requireAuth, async (req, res, next) => {
  try {
    const area = req.params.area.toUpperCase();
    if (!(await checkAreaPermission(req, res, area))) return;

    const { payload } = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ ok: false, message: 'Valid payload object is required.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Lock area row
      const [[pub]] = await conn.query('SELECT * FROM cms_publications WHERE area = ? FOR UPDATE', [area]);

      // Calculate next revision number
      const [[maxRev]] = await conn.query('SELECT MAX(revision_number) AS max_num FROM cms_revisions WHERE area = ?', [area]);
      const nextRevNum = (maxRev?.max_num || 0) + 1;

      const payloadStr = JSON.stringify(payload);
      const [insertRes] = await conn.query(
        `INSERT INTO cms_revisions (area, revision_number, payload, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?)`,
        [area, nextRevNum, payloadStr, req.adminId, req.adminId]
      );
      const newDraftRevId = insertRes.insertId;

      // Update cms_publications draft pointer
      await conn.query(
        'UPDATE cms_publications SET draft_revision_id = ?, row_version = row_version + 1 WHERE area = ?',
        [newDraftRevId, area]
      );

      await conn.commit();

      return res.json({
        ok: true,
        success: true,
        message: `${area} draft saved successfully.`,
        revisionNumber: nextRevNum
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

// ─── POST /api/cms/:area/publish ── Publish Changes ──────────────────────────
router.post('/:area/publish', requireAuth, async (req, res, next) => {
  try {
    const area = req.params.area.toUpperCase();
    if (!(await checkAreaPermission(req, res, area))) return;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[pub]] = await conn.query('SELECT * FROM cms_publications WHERE area = ? FOR UPDATE', [area]);
      if (!pub) return res.status(404).json({ ok: false, message: 'Area not found.' });

      // If no draft exists, and payload was sent directly in publish request, save it first
      let revToPublish = pub.draft_revision_id;

      if (req.body.payload) {
        const [[maxRev]] = await conn.query('SELECT MAX(revision_number) AS max_num FROM cms_revisions WHERE area = ?', [area]);
        const nextRevNum = (maxRev?.max_num || 0) + 1;
        const [ins] = await conn.query(
          `INSERT INTO cms_revisions (area, revision_number, payload, created_by, updated_by)
           VALUES (?, ?, ?, ?, ?)`,
          [area, nextRevNum, JSON.stringify(req.body.payload), req.adminId, req.adminId]
        );
        revToPublish = ins.insertId;
      }

      if (!revToPublish) {
        return res.status(400).json({ ok: false, message: 'No draft revision found to publish.' });
      }

      await conn.query(
        `UPDATE cms_publications
         SET published_revision_id = ?, draft_revision_id = NULL, row_version = row_version + 1, published_by = ?, published_at = NOW(6)
         WHERE area = ?`,
        [revToPublish, req.adminId, area]
      );

      await conn.commit();

      return res.json({
        ok: true,
        success: true,
        message: `${area} published to live website successfully.`
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

// ─── GET /api/cms/:area/preview ── Preview Draft (Authorized Admins Only) ────
router.get('/:area/preview', requireAuth, async (req, res, next) => {
  try {
    const area = req.params.area.toUpperCase();
    if (!(await checkAreaPermission(req, res, area))) return;

    const [[pub]] = await pool.query('SELECT * FROM cms_publications WHERE area = ?', [area]);
    const targetRevId = pub?.draft_revision_id || pub?.published_revision_id;

    if (!targetRevId) return res.status(404).json({ ok: false, message: 'No content available for preview.' });

    const [[rev]] = await pool.query('SELECT payload FROM cms_revisions WHERE id = ?', [targetRevId]);
    let payload = rev.payload;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch {}
    }

    return res.json({
      ok: true,
      success: true,
      area,
      isPreview: true,
      isDraft: Boolean(pub.draft_revision_id),
      payload
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/cms/:area/published ── Public Read Published Version ───────────
router.get('/:area/published', async (req, res, next) => {
  try {
    const area = req.params.area.toUpperCase();
    const [[pub]] = await pool.query('SELECT published_revision_id, published_at FROM cms_publications WHERE area = ?', [area]);

    if (!pub || !pub.published_revision_id) {
      return res.json({ ok: true, success: true, payload: null });
    }

    const [[rev]] = await pool.query('SELECT payload FROM cms_revisions WHERE id = ?', [pub.published_revision_id]);
    let payload = rev?.payload;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch {}
    }

    return res.json({
      ok: true,
      success: true,
      area,
      publishedAt: pub.published_at,
      payload
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
