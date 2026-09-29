'use strict';

const express = require('express');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const storage = require('../storage');

const router = express.Router({ mergeParams: true });
router.use(requireAuth);

const isSuperAdmin = (req) => req.adminRole === 'SUPER_ADMIN';

async function verifyGalleryAccess(req, res) {
  if (isSuperAdmin(req)) return true;
  const [[grant]] = await pool.query(
    'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?',
    [req.adminId, 'website.gallery']
  );
  if (!grant) {
    res.status(403).json({ ok: false, message: 'Permission denied. Required permission: website.gallery' });
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ALBUMS ENDPOINTS (/api/admin/gallery/albums)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/gallery/albums - List all albums
router.get('/albums', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    let whereSql = '';
    const params = [];
    if (search) {
      whereSql = 'WHERE a.title LIKE ? OR a.description LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM gallery_albums a ${whereSql}`,
      params
    );

    const [albums] = await pool.query(
      `SELECT a.id, a.title, a.description, a.camp_year, a.camp_date, a.camp_id,
              a.cover_asset_id, a.is_published, a.sort_order, a.created_at, a.updated_at,
              c.public_title AS camp_title,
              ma.relative_path AS cover_relative_path,
              (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id = a.id) AS photo_count,
              (SELECT COUNT(*) FROM gallery_categories cat WHERE cat.album_id = a.id) AS category_count
       FROM gallery_albums a
       LEFT JOIN camps c ON c.id = a.camp_id
       LEFT JOIN media_assets ma ON ma.id = a.cover_asset_id
       ${whereSql}
       ORDER BY a.sort_order ASC, a.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const formatted = albums.map(a => ({
      id: Number(a.id),
      title: a.title,
      description: a.description,
      camp_year: a.camp_year,
      camp_date: a.camp_date,
      camp_id: a.camp_id ? Number(a.camp_id) : null,
      camp_title: a.camp_title || null,
      cover_asset_id: a.cover_asset_id ? Number(a.cover_asset_id) : null,
      cover_url: a.cover_relative_path ? storage.toPublicUrl(a.cover_relative_path) : null,
      is_published: Boolean(a.is_published),
      sort_order: Number(a.sort_order),
      photo_count: Number(a.photo_count || 0),
      category_count: Number(a.category_count || 0),
      created_at: a.created_at,
      updated_at: a.updated_at
    }));

    return res.json({
      ok: true,
      success: true,
      data: {
        albums: formatted,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/gallery/albums - Create album (starts unpublished)
router.post('/albums', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;

    const {
      title,
      description,
      camp_year,
      camp_date,
      camp_id,
      cover_asset_id,
      sort_order
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ ok: false, message: 'Album title is required.' });
    }

    let parsedCampId = null;
    if (camp_id !== undefined && camp_id !== null && camp_id !== '') {
      parsedCampId = Number(camp_id);
      if (isNaN(parsedCampId)) return res.status(400).json({ ok: false, message: 'Invalid camp_id.' });
      const [[camp]] = await pool.query('SELECT id FROM camps WHERE id = ?', [parsedCampId]);
      if (!camp) return res.status(404).json({ ok: false, message: 'Associated camp not found.' });
    }

    let parsedCoverAssetId = null;
    if (cover_asset_id) {
      parsedCoverAssetId = Number(cover_asset_id);
      const [[asset]] = await pool.query('SELECT id FROM media_assets WHERE id = ?', [parsedCoverAssetId]);
      if (!asset) return res.status(404).json({ ok: false, message: 'Cover image asset not found.' });
    }

    let parsedYear = null;
    if (camp_year) {
      parsedYear = Number(camp_year);
      if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2200) {
        return res.status(400).json({ ok: false, message: 'Invalid camp year.' });
      }
    }

    // Determine sort_order (default to end of list)
    let finalSortOrder = Number(sort_order);
    if (isNaN(finalSortOrder)) {
      const [[maxOrder]] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM gallery_albums');
      finalSortOrder = maxOrder.next_order;
    }

    const [result] = await pool.query(`
      INSERT INTO gallery_albums (
        title, description, camp_year, camp_date, camp_id, cover_asset_id,
        is_published, sort_order, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `, [
      title.trim(),
      description?.trim() || null,
      parsedYear,
      camp_date || null,
      parsedCampId,
      parsedCoverAssetId,
      finalSortOrder,
      req.adminId,
      req.adminId
    ]);

    const newAlbumId = result.insertId;

    return res.status(201).json({
      ok: true,
      success: true,
      message: 'Camp gallery album created successfully (starts unpublished).',
      data: {
        id: newAlbumId,
        title: title.trim(),
        description: description?.trim() || null,
        camp_year: parsedYear,
        camp_date: camp_date || null,
        camp_id: parsedCampId,
        cover_asset_id: parsedCoverAssetId,
        is_published: false,
        sort_order: finalSortOrder
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/gallery/albums/reorder - Reorder albums
router.put('/albums/reorder', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;

    const { orderedIds, previousIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.some(id => !Number.isSafeInteger(Number(id)) || Number(id) < 1)) {
      return res.status(400).json({ ok: false, message: 'Provide a valid array of numeric album IDs.' });
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      return res.status(400).json({ ok: false, message: 'Duplicate album IDs detected.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query('SELECT id FROM gallery_albums ORDER BY sort_order ASC, id DESC FOR UPDATE');
      const allIds = rows.map(r => Number(r.id));

      if (allIds.length !== orderedIds.length || orderedIds.some(id => !allIds.includes(Number(id)))) {
        await conn.rollback();
        return res.status(400).json({
          ok: false,
          message: 'Order must contain every album ID exactly once. Please refresh and retry.'
        });
      }

      if (previousIds && JSON.stringify(previousIds.map(Number)) !== JSON.stringify(allIds)) {
        await conn.rollback();
        return res.status(409).json({ ok: false, message: 'Order changed elsewhere. Refresh before reordering.' });
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query('UPDATE gallery_albums SET sort_order = ?, updated_by = ? WHERE id = ?', [i + 1, req.adminId, orderedIds[i]]);
      }

      await conn.commit();
      return res.json({ ok: true, success: true, message: 'Albums reordered successfully.' });
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

// GET /api/admin/gallery/albums/:id - Album detail
router.get('/albums/:id', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;

    const albumId = Number(req.params.id);
    if (!albumId || isNaN(albumId)) return res.status(400).json({ ok: false, message: 'Valid album ID is required.' });

    const [[album]] = await pool.query(
      `SELECT a.*, c.public_title AS camp_title, ma.relative_path AS cover_relative_path
       FROM gallery_albums a
       LEFT JOIN camps c ON c.id = a.camp_id
       LEFT JOIN media_assets ma ON ma.id = a.cover_asset_id
       WHERE a.id = ?`,
      [albumId]
    );

    if (!album) return res.status(404).json({ ok: false, message: 'Gallery album not found.' });

    return res.json({
      ok: true,
      success: true,
      data: {
        id: Number(album.id),
        title: album.title,
        description: album.description,
        camp_year: album.camp_year,
        camp_date: album.camp_date,
        camp_id: album.camp_id ? Number(album.camp_id) : null,
        camp_title: album.camp_title || null,
        cover_asset_id: album.cover_asset_id ? Number(album.cover_asset_id) : null,
        cover_url: album.cover_relative_path ? storage.toPublicUrl(album.cover_relative_path) : null,
        is_published: Boolean(album.is_published),
        sort_order: Number(album.sort_order),
        created_at: album.created_at,
        updated_at: album.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/gallery/albums/:id - Update album details
router.put('/albums/:id', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;

    const albumId = Number(req.params.id);
    if (!albumId || isNaN(albumId)) return res.status(400).json({ ok: false, message: 'Valid album ID is required.' });

    const [[existing]] = await pool.query('SELECT * FROM gallery_albums WHERE id = ?', [albumId]);
    if (!existing) return res.status(404).json({ ok: false, message: 'Gallery album not found.' });

    const updates = {};
    if ('title' in req.body) {
      if (!req.body.title || !req.body.title.trim()) {
        return res.status(400).json({ ok: false, message: 'Album title cannot be empty.' });
      }
      updates.title = req.body.title.trim();
    }
    if ('description' in req.body) {
      updates.description = req.body.description?.trim() || null;
    }
    if ('camp_year' in req.body) {
      const yr = Number(req.body.camp_year);
      updates.camp_year = (!isNaN(yr) && yr > 1900) ? yr : null;
    }
    if ('camp_date' in req.body) {
      updates.camp_date = req.body.camp_date || null;
    }
    if ('camp_id' in req.body) {
      const cId = Number(req.body.camp_id);
      if (req.body.camp_id && !isNaN(cId)) {
        const [[c]] = await pool.query('SELECT id FROM camps WHERE id = ?', [cId]);
        if (!c) return res.status(404).json({ ok: false, message: 'Camp not found.' });
        updates.camp_id = cId;
      } else {
        updates.camp_id = null;
      }
    }
    if ('cover_asset_id' in req.body) {
      const aId = Number(req.body.cover_asset_id);
      if (req.body.cover_asset_id && !isNaN(aId)) {
        const [[a]] = await pool.query('SELECT id FROM media_assets WHERE id = ?', [aId]);
        if (!a) return res.status(404).json({ ok: false, message: 'Cover asset not found.' });
        updates.cover_asset_id = aId;
      } else {
        updates.cover_asset_id = null;
      }
    }
    if ('is_published' in req.body) {
      updates.is_published = req.body.is_published ? 1 : 0;
    }
    if ('sort_order' in req.body) {
      const so = Number(req.body.sort_order);
      if (!isNaN(so)) updates.sort_order = so;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, message: 'Nothing to update.' });
    }

    updates.updated_by = req.adminId;
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE gallery_albums SET ${setClauses} WHERE id = ?`, [...Object.values(updates), albumId]);

    const [[updated]] = await pool.query('SELECT * FROM gallery_albums WHERE id = ?', [albumId]);
    return res.json({
      ok: true,
      success: true,
      message: 'Album updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/gallery/albums/:id - Destructive album delete
// Deletes album, photos, categories. Unlinks media assets without deleting files referenced elsewhere or camps.
router.delete('/albums/:id', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;

    const albumId = Number(req.params.id);
    if (!albumId || isNaN(albumId)) return res.status(400).json({ ok: false, message: 'Valid album ID is required.' });

    const [[album]] = await pool.query('SELECT id, title FROM gallery_albums WHERE id = ?', [albumId]);
    if (!album) return res.status(404).json({ ok: false, message: 'Gallery album not found.' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Unlink media assets associated with this album
      await conn.query('UPDATE media_assets SET album_id = NULL WHERE album_id = ?', [albumId]);

      // 2. Delete photos and categories
      await conn.query('DELETE FROM gallery_photos WHERE album_id = ?', [albumId]);
      await conn.query('DELETE FROM gallery_categories WHERE album_id = ?', [albumId]);

      // 3. Delete album itself
      await conn.query('DELETE FROM gallery_albums WHERE id = ?', [albumId]);

      await conn.commit();
      return res.json({
        ok: true,
        success: true,
        message: `Gallery album "${album.title}" and its photo records were deleted successfully.`
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

// ─────────────────────────────────────────────────────────────────────────────
// 2. NESTED PHOTOS ENDPOINTS (/api/admin/gallery/albums/:albumId/photos)
// ─────────────────────────────────────────────────────────────────────────────

// Helper to verify album exists
async function getValidAlbum(albumId, res) {
  const id = Number(albumId);
  if (!id || isNaN(id)) {
    res.status(400).json({ ok: false, message: 'Valid numeric albumId is required.' });
    return null;
  }
  const [[album]] = await pool.query('SELECT * FROM gallery_albums WHERE id = ?', [id]);
  if (!album) {
    res.status(404).json({ ok: false, message: 'Gallery album not found.' });
    return null;
  }
  return album;
}

// GET /api/admin/gallery/albums/:albumId/photos
router.get('/albums/:albumId/photos', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const offset = (page - 1) * limit;
    const category = (req.query.category || '').trim();

    let whereSql = 'WHERE p.album_id = ?';
    const params = [album.id];
    if (category && category !== 'All') {
      whereSql += ' AND p.category = ?';
      params.push(category);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM gallery_photos p ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT p.id, p.album_id, p.camp_id, p.asset_id, p.category, p.alt_text, p.caption,
              p.is_visible, p.sort_order, p.created_at, p.updated_at,
              ma.relative_path, ma.width_px, ma.height_px, ma.byte_size
       FROM gallery_photos p
       LEFT JOIN media_assets ma ON ma.id = p.asset_id
       ${whereSql}
       ORDER BY p.sort_order ASC, p.id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const photos = rows.map(r => {
      const url = r.relative_path ? storage.toPublicUrl(r.relative_path) : null;
      return {
        id: Number(r.id),
        album_id: Number(r.album_id),
        camp_id: r.camp_id ? Number(r.camp_id) : null,
        asset_id: Number(r.asset_id),
        category: r.category,
        alt_text: r.alt_text,
        caption: r.caption,
        is_visible: Boolean(r.is_visible),
        sort_order: Number(r.sort_order),
        photo_url: url,
        image_url: url,
        photoUrl: url,
        relative_path: r.relative_path,
        width_px: r.width_px,
        height_px: r.height_px,
        byte_size: r.byte_size,
        created_at: r.created_at
      };
    });

    return res.json({
      ok: true,
      success: true,
      data: {
        photos,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/gallery/albums/:albumId/photos
router.post('/albums/:albumId/photos', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const { asset_id, category, alt_text, caption, is_visible, sort_order } = req.body;
    const parsedAssetId = Number(asset_id);
    if (!parsedAssetId || isNaN(parsedAssetId)) {
      return res.status(400).json({ ok: false, message: 'Valid asset_id is required.' });
    }

    const [[asset]] = await pool.query('SELECT id, relative_path FROM media_assets WHERE id = ?', [parsedAssetId]);
    if (!asset) return res.status(404).json({ ok: false, message: 'Media asset not found.' });

    // Link asset to album if unlinked
    await pool.query('UPDATE media_assets SET album_id = ? WHERE id = ?', [album.id, parsedAssetId]);

    let finalOrder = Number(sort_order);
    if (isNaN(finalOrder)) {
      const [[maxOrder]] = await pool.query(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM gallery_photos WHERE album_id = ?',
        [album.id]
      );
      finalOrder = maxOrder.next_order;
    }

    const visibleVal = is_visible !== undefined ? (is_visible ? 1 : 0) : 1;

    const [result] = await pool.query(
      `INSERT INTO gallery_photos (album_id, camp_id, asset_id, category, alt_text, caption, is_visible, sort_order, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        album.id,
        album.camp_id || null,
        parsedAssetId,
        category?.trim() || null,
        alt_text?.trim() || 'BDC Camp Moment',
        caption?.trim() || '',
        visibleVal,
        finalOrder,
        req.adminId,
        req.adminId
      ]
    );

    // If album has no cover image yet, set this as cover
    if (!album.cover_asset_id) {
      await pool.query('UPDATE gallery_albums SET cover_asset_id = ? WHERE id = ?', [parsedAssetId, album.id]);
    }

    const newPhotoId = result.insertId;
    const photoUrl = storage.toPublicUrl(asset.relative_path);

    return res.status(201).json({
      ok: true,
      success: true,
      data: {
        id: newPhotoId,
        album_id: album.id,
        asset_id: parsedAssetId,
        category: category?.trim() || null,
        alt_text: alt_text?.trim() || 'BDC Camp Moment',
        caption: caption?.trim() || '',
        is_visible: Boolean(visibleVal),
        sort_order: finalOrder,
        photo_url: photoUrl,
        image_url: photoUrl
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/gallery/albums/:albumId/photos/reorder
router.put('/albums/:albumId/photos/reorder', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const { orderedIds, previousIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.some(id => !Number.isSafeInteger(Number(id)) || Number(id) < 1)) {
      return res.status(400).json({ ok: false, message: 'Provide a valid array of numeric photo IDs.' });
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      return res.status(400).json({ ok: false, message: 'Duplicate photo IDs detected.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        'SELECT id FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC, id ASC FOR UPDATE',
        [album.id]
      );
      const allIds = rows.map(r => Number(r.id));

      if (allIds.length !== orderedIds.length || orderedIds.some(id => !allIds.includes(Number(id)))) {
        await conn.rollback();
        return res.status(400).json({
          ok: false,
          message: 'Order must contain every photo in this album exactly once. Please refresh and retry.'
        });
      }

      if (previousIds && JSON.stringify(previousIds.map(Number)) !== JSON.stringify(allIds)) {
        await conn.rollback();
        return res.status(409).json({ ok: false, message: 'Order changed elsewhere. Refresh before reordering.' });
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query('UPDATE gallery_photos SET sort_order = ?, updated_by = ? WHERE id = ?', [i + 1, req.adminId, orderedIds[i]]);
      }

      await conn.commit();
      return res.json({ ok: true, success: true, message: 'Photos reordered successfully.' });
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

// PUT /api/admin/gallery/albums/:albumId/photos/:photoId
router.put('/albums/:albumId/photos/:photoId', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const photoId = Number(req.params.photoId);
    const [[photo]] = await pool.query('SELECT * FROM gallery_photos WHERE id = ? AND album_id = ?', [photoId, album.id]);
    if (!photo) return res.status(404).json({ ok: false, message: 'Photo not found in this album.' });

    const updates = {};
    if ('category' in req.body) updates.category = req.body.category?.trim() || null;
    if ('alt_text' in req.body) updates.alt_text = req.body.alt_text?.trim() || 'BDC Camp Moment';
    if ('caption' in req.body) updates.caption = req.body.caption?.trim() || '';
    if ('is_visible' in req.body) updates.is_visible = req.body.is_visible ? 1 : 0;
    if ('sort_order' in req.body) {
      const so = Number(req.body.sort_order);
      if (!isNaN(so)) updates.sort_order = so;
    }
    if ('asset_id' in req.body) {
      const aid = Number(req.body.asset_id);
      if (aid && !isNaN(aid)) {
        const [[a]] = await pool.query('SELECT id FROM media_assets WHERE id = ?', [aid]);
        if (!a) return res.status(404).json({ ok: false, message: 'Replacement asset not found.' });
        updates.asset_id = aid;
        await pool.query('UPDATE media_assets SET album_id = ? WHERE id = ?', [album.id, aid]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, message: 'Nothing to update.' });
    }

    updates.updated_by = req.adminId;
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE gallery_photos SET ${setClauses} WHERE id = ?`, [...Object.values(updates), photoId]);

    const [[updated]] = await pool.query(`
      SELECT p.*, ma.relative_path
      FROM gallery_photos p
      LEFT JOIN media_assets ma ON ma.id = p.asset_id
      WHERE p.id = ?
    `, [photoId]);

    return res.json({
      ok: true,
      success: true,
      message: 'Photo updated successfully.',
      data: {
        ...updated,
        photo_url: updated.relative_path ? storage.toPublicUrl(updated.relative_path) : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/gallery/albums/:albumId/photos/:photoId
router.delete('/albums/:albumId/photos/:photoId', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const photoId = Number(req.params.photoId);
    const [[photo]] = await pool.query('SELECT * FROM gallery_photos WHERE id = ? AND album_id = ?', [photoId, album.id]);
    if (!photo) return res.status(404).json({ ok: false, message: 'Photo not found in this album.' });

    // If photo asset was album cover, unlink cover
    if (album.cover_asset_id === photo.asset_id) {
      await pool.query('UPDATE gallery_albums SET cover_asset_id = NULL WHERE id = ?', [album.id]);
    }

    await pool.query('DELETE FROM gallery_photos WHERE id = ?', [photoId]);

    return res.json({ ok: true, success: true, message: 'Photo deleted successfully from album.' });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. NESTED CATEGORIES ENDPOINTS (/api/admin/gallery/albums/:albumId/categories)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/gallery/albums/:albumId/categories
router.get('/albums/:albumId/categories', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const [rows] = await pool.query(
      'SELECT id, album_id, camp_id, name, sort_order FROM gallery_categories WHERE album_id = ? ORDER BY sort_order ASC, name ASC',
      [album.id]
    );

    return res.json({ ok: true, success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/gallery/albums/:albumId/categories
router.post('/albums/:albumId/categories', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const { name, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ ok: false, message: 'Category name is required.' });
    }

    const trimmed = name.trim();
    const [[existing]] = await pool.query(
      'SELECT id FROM gallery_categories WHERE album_id = ? AND name = ?',
      [album.id, trimmed]
    );
    if (existing) {
      return res.status(409).json({ ok: false, message: 'A category with this name already exists in this album.' });
    }

    let order = Number(sort_order);
    if (isNaN(order)) {
      const [[maxOrder]] = await pool.query(
        'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM gallery_categories WHERE album_id = ?',
        [album.id]
      );
      order = maxOrder.next_order;
    }

    const [result] = await pool.query(
      'INSERT INTO gallery_categories (album_id, camp_id, name, sort_order) VALUES (?, ?, ?, ?)',
      [album.id, album.camp_id || null, trimmed, order]
    );

    return res.status(201).json({
      ok: true,
      success: true,
      data: {
        id: result.insertId,
        album_id: album.id,
        name: trimmed,
        sort_order: order
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/gallery/albums/:albumId/categories/:categoryId - Rename category
// Renaming must be transactional with related photos
router.put('/albums/:albumId/categories/:categoryId', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const categoryId = Number(req.params.categoryId);
    const [[current]] = await pool.query(
      'SELECT * FROM gallery_categories WHERE id = ? AND album_id = ?',
      [categoryId, album.id]
    );
    if (!current) return res.status(404).json({ ok: false, message: 'Category not found in this album.' });

    const { name, sort_order } = req.body;
    const newName = name?.trim();
    const oldName = current.name;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (newName && newName !== oldName) {
        // Check uniqueness within album
        const [[conflict]] = await conn.query(
          'SELECT id FROM gallery_categories WHERE album_id = ? AND name = ? AND id != ?',
          [album.id, newName, categoryId]
        );
        if (conflict) {
          await conn.rollback();
          return res.status(409).json({ ok: false, message: 'Another category with this name already exists in this album.' });
        }

        await conn.query('UPDATE gallery_categories SET name = ? WHERE id = ?', [newName, categoryId]);
        // Update all photos in this album that had the old category name
        await conn.query(
          'UPDATE gallery_photos SET category = ?, updated_by = ? WHERE album_id = ? AND category = ?',
          [newName, req.adminId, album.id, oldName]
        );
      }

      if (sort_order !== undefined) {
        const orderNum = Number(sort_order);
        if (!isNaN(orderNum)) {
          await conn.query('UPDATE gallery_categories SET sort_order = ? WHERE id = ?', [orderNum, categoryId]);
        }
      }

      await conn.commit();
      return res.json({
        ok: true,
        success: true,
        data: { id: categoryId, album_id: album.id, name: newName || oldName }
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

// DELETE /api/admin/gallery/albums/:albumId/categories/:categoryId - Delete category
// Deleting leaves related photos uncategorized
router.delete('/albums/:albumId/categories/:categoryId', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const categoryId = Number(req.params.categoryId);
    const [[category]] = await pool.query(
      'SELECT * FROM gallery_categories WHERE id = ? AND album_id = ?',
      [categoryId, album.id]
    );
    if (!category) return res.status(404).json({ ok: false, message: 'Category not found in this album.' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Clear category on photos belonging to this album
      await conn.query(
        'UPDATE gallery_photos SET category = NULL, updated_by = ? WHERE album_id = ? AND category = ?',
        [req.adminId, album.id, category.name]
      );

      // Delete category
      await conn.query('DELETE FROM gallery_categories WHERE id = ?', [categoryId]);

      await conn.commit();
      return res.json({
        ok: true,
        success: true,
        message: 'Category deleted. Related photos are now uncategorized.'
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

// PUT /api/admin/gallery/albums/:albumId/categories/reorder
router.put('/albums/:albumId/categories/reorder', async (req, res, next) => {
  try {
    if (!(await verifyGalleryAccess(req, res))) return;
    const album = await getValidAlbum(req.params.albumId, res);
    if (!album) return;

    const { orderedIds, previousIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.some(id => !Number.isSafeInteger(Number(id)) || Number(id) < 1)) {
      return res.status(400).json({ ok: false, message: 'Provide a valid array of numeric category IDs.' });
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      return res.status(400).json({ ok: false, message: 'Duplicate category IDs detected.' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        'SELECT id FROM gallery_categories WHERE album_id = ? ORDER BY sort_order ASC, name ASC FOR UPDATE',
        [album.id]
      );
      const allIds = rows.map(r => Number(r.id));

      if (allIds.length !== orderedIds.length || orderedIds.some(id => !allIds.includes(Number(id)))) {
        await conn.rollback();
        return res.status(400).json({
          ok: false,
          message: 'Order must contain every category in this album exactly once. Please refresh and retry.'
        });
      }

      if (previousIds && JSON.stringify(previousIds.map(Number)) !== JSON.stringify(allIds)) {
        await conn.rollback();
        return res.status(409).json({ ok: false, message: 'Order changed elsewhere. Refresh before reordering.' });
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query('UPDATE gallery_categories SET sort_order = ? WHERE id = ?', [i + 1, orderedIds[i]]);
      }

      await conn.commit();
      return res.json({ ok: true, success: true, message: 'Categories reordered successfully.' });
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

// ─────────────────────────────────────────────────────────────────────────────
// 4. LEGACY /api/camps/:campId/gallery TRANSITION & COMPATIBILITY
// ─────────────────────────────────────────────────────────────────────────────
// Documented transition: if legacy camp gallery route is called, map to camp's album
router.get('/:campId/gallery', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    if (!campId || isNaN(campId)) {
      return res.status(400).json({ ok: false, message: 'Valid camp ID is required.' });
    }

    // Must still have website.gallery permission or super admin
    if (!(await verifyGalleryAccess(req, res))) return;

    // Find album for this camp
    const [[album]] = await pool.query('SELECT id FROM gallery_albums WHERE camp_id = ? LIMIT 1', [campId]);
    if (!album) {
      return res.json({ ok: true, success: true, data: [] });
    }

    const [rows] = await pool.query(
      `SELECT g.id, g.album_id, g.camp_id, g.asset_id, g.category, g.alt_text, g.caption, g.is_visible, g.sort_order,
              a.relative_path, a.byte_size, a.width_px, a.height_px
       FROM gallery_photos g
       LEFT JOIN media_assets a ON a.id = g.asset_id
       WHERE g.album_id = ?
       ORDER BY g.sort_order, g.id`,
      [album.id]
    );

    const formatted = rows.map(r => {
      const url = r.relative_path ? storage.toPublicUrl(r.relative_path) : null;
      return {
        id: r.id,
        album_id: r.album_id,
        camp_id: r.camp_id,
        asset_id: r.asset_id,
        category: r.category,
        alt_text: r.alt_text,
        caption: r.caption,
        photo_url: url,
        image_url: url,
        photoUrl: url,
        relative_path: r.relative_path,
        is_visible: Boolean(r.is_visible),
        sort_order: r.sort_order
      };
    });

    return res.json({ ok: true, success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// Legacy reorder compatibility for test suites
router.put('/:campId/gallery/reorder', async (req, res, next) => {
  try {
    const campId = Number(req.params.campId);
    if (!(await verifyGalleryAccess(req, res))) return;

    const [[album]] = await pool.query('SELECT id FROM gallery_albums WHERE camp_id = ? LIMIT 1', [campId]);
    if (!album) {
      return res.status(404).json({ ok: false, message: 'No gallery album found for this camp.' });
    }

    // Delegate to photos reorder logic
    req.params.albumId = album.id;
    const { orderedIds, previousIds } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        'SELECT id FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC, id ASC FOR UPDATE',
        [album.id]
      );
      const allIds = rows.map(r => Number(r.id));

      if (allIds.length !== orderedIds.length || orderedIds.some(id => !allIds.includes(Number(id)))) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: 'Invalid reorder ids.' });
      }

      if (previousIds && JSON.stringify(previousIds.map(Number)) !== JSON.stringify(allIds)) {
        await conn.rollback();
        return res.status(409).json({ ok: false, message: 'Order changed elsewhere.' });
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await conn.query('UPDATE gallery_photos SET sort_order = ? WHERE id = ?', [i + 1, orderedIds[i]]);
      }

      await conn.commit();
      return res.json({ ok: true, success: true });
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

module.exports = router;
