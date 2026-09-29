'use strict';

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { imageSize } = require('image-size');
const { pool } = require('../db');
const requireAuth = require('../middleware/requireAuth');
const storage = require('../storage');

const router = express.Router();
router.use(requireAuth);

// Configure multer memory storage so we can validate magic bytes and dimensions safely
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

/**
 * Validate image buffer headers (magic bytes) to prevent disguised non-image files.
 * @param {Buffer} buffer
 * @returns {string|null} detected mime type or null
 */
function validateMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return 'image/png';
  }

  // WebP: 'RIFF' at 0..3 and 'WEBP' at 8..11
  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  if (riff === 'RIFF' && webp === 'WEBP') {
    return 'image/webp';
  }

  return null;
}

// ─── POST /api/upload ────────────────────────────────────────────────────────
router.post('/', upload.single('file'), async (req, res, next) => {
  let savedFileInfo = null;
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No image file uploaded.' });
    }

    // 1. Magic bytes validation
    const detectedMime = validateMagicBytes(req.file.buffer);
    if (!detectedMime) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid file signature. Only authentic JPEG, PNG, and WebP images are accepted.'
      });
    }

    // 2. Extract true dimensions using image-size
    let dimensions;
    try {
      dimensions = imageSize(req.file.buffer);
    } catch (dimErr) {
      return res.status(400).json({
        ok: false,
        message: 'Could not parse image dimensions. File may be corrupted.'
      });
    }

    if (!dimensions || !dimensions.width || !dimensions.height) {
      return res.status(400).json({ ok: false, message: 'Invalid image dimensions.' });
    }

    const MAX_PIXEL_DIM = 6000;
    if (dimensions.width > MAX_PIXEL_DIM || dimensions.height > MAX_PIXEL_DIM) {
      return res.status(400).json({
        ok: false,
        message: `Image dimensions (${dimensions.width}x${dimensions.height}) exceed maximum allowed of ${MAX_PIXEL_DIM}px.`
      });
    }

    const { kind, camp_id, campId, album_id, albumId, area } = req.body;
    const allowedKinds = ['TEAM', 'GALLERY', 'SPONSOR', 'HERO', 'SITE'];
    if (!kind || typeof kind !== 'string' || !allowedKinds.includes(kind.toUpperCase())) {
      return res.status(400).json({
        ok: false,
        message: `Invalid or missing media kind. Must be one of: ${allowedKinds.join(', ')}.`
      });
    }
    const mediaKind = kind.toUpperCase();

    // Map logical kind to target flat folder:
    // HERO & SITE -> camps, TEAM -> teams, SPONSOR -> sponsors, GALLERY -> gallery
    const targetFolder = storage.getFolderForKind(mediaKind);

    const validAreas = ['homepage', 'about', 'notices', 'faq', 'contact', 'pages', 'registration_text'];
    let normalizedArea = null;
    if (mediaKind === 'SITE') {
      normalizedArea = (area || '').toLowerCase().trim();
      if (!normalizedArea || !validAreas.includes(normalizedArea)) {
        return res.status(400).json({
          ok: false,
          message: `Invalid or missing area for SITE media. Must be one of: ${validAreas.join(', ')}.`
        });
      }
    }

    let targetCampId = null;
    let targetAlbumId = null;

    // Validate scope and permissions based on logical media kind
    if (mediaKind === 'GALLERY') {
      const parsedAlbumId = Number(album_id || albumId);
      if (!parsedAlbumId || isNaN(parsedAlbumId)) {
        return res.status(400).json({
          ok: false,
          message: 'album_id is required for GALLERY media uploads.'
        });
      }

      const [[album]] = await pool.query('SELECT id, camp_id FROM gallery_albums WHERE id = ?', [parsedAlbumId]);
      if (!album) {
        return res.status(404).json({ ok: false, message: 'Gallery album not found.' });
      }
      targetAlbumId = album.id;
      targetCampId = album.camp_id || null;

      // Gallery permission enforcement
      if (req.adminRole !== 'SUPER_ADMIN') {
        const [[grant]] = await pool.query(
          'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?',
          [req.adminId, 'website.gallery']
        );
        if (!grant) {
          return res.status(403).json({
            ok: false,
            message: 'Permission denied. Required permission: website.gallery'
          });
        }
      }
    } else if (['TEAM', 'SPONSOR'].includes(mediaKind)) {
      const parsedCampId = Number(camp_id || campId);
      if (!parsedCampId || isNaN(parsedCampId)) {
        return res.status(400).json({ ok: false, message: 'camp_id is required for camp-scoped media.' });
      }
      targetCampId = parsedCampId;
      const [[camp]] = await pool.query('SELECT id FROM camps WHERE id = ?', [targetCampId]);
      if (!camp) return res.status(404).json({ ok: false, message: 'Camp not found.' });

      if (req.adminRole !== 'SUPER_ADMIN') {
        const requiredPerm = mediaKind === 'TEAM' ? 'camp.team' : 'camp.sponsors';
        const [[grant]] = await pool.query(
          'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?',
          [req.adminId, requiredPerm]
        );
        if (!grant) {
          return res.status(403).json({
            ok: false,
            message: `Permission denied. Required permission: ${requiredPerm}`
          });
        }

        const [[state]] = await pool.query('SELECT live_camp_id FROM site_state WHERE id = 1');
        if (state?.live_camp_id !== targetCampId) {
          return res.status(403).json({ ok: false, message: 'Access restricted to the current live camp.' });
        }
      }
    } else if (mediaKind === 'HERO') {
      if (req.adminRole !== 'SUPER_ADMIN') {
        const [[grant]] = await pool.query(
          'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?',
          [req.adminId, 'website.homepage']
        );
        if (!grant) {
          return res.status(403).json({
            ok: false,
            message: 'Permission denied. Required permission: website.homepage'
          });
        }
      }
    } else if (mediaKind === 'SITE') {
      if (req.adminRole !== 'SUPER_ADMIN') {
        const requiredPerm = `website.${normalizedArea}`;
        const [[grant]] = await pool.query(
          'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = ?',
          [req.adminId, requiredPerm]
        );
        if (!grant) {
          return res.status(403).json({
            ok: false,
            message: `Permission denied. Required permission: ${requiredPerm}`
          });
        }
      }
    }

    // Determine extension based on validated image content
    const ext = detectedMime === 'image/png' ? '.png' : (detectedMime === 'image/webp' ? '.webp' : '.jpg');

    // Save exclusively to pre-provisioned directory (no runtime mkdir)
    try {
      savedFileInfo = storage.saveFileExclusively(targetFolder, req.file.buffer, ext);
    } catch (fsErr) {
      console.error('[upload] Storage error saving file to', targetFolder, fsErr.message);
      const isConfigError = ['ENOENT', 'EACCES', 'EPERM'].includes(fsErr.code);
      return res.status(500).json({
        ok: false,
        message: isConfigError
          ? `Storage error: target directory '${targetFolder}' is not accessible (${fsErr.code}). Please verify storage provisioning.`
          : `Storage write failure: ${fsErr.message}`
      });
    }

    let insertResult;
    try {
      const [result] = await pool.query(
        `INSERT INTO media_assets (camp_id, album_id, media_kind, relative_path, mime_type, byte_size, width_px, height_px, sha256, uploaded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          targetCampId,
          targetAlbumId,
          mediaKind,
          savedFileInfo.relativePath,
          detectedMime,
          savedFileInfo.byteSize,
          dimensions.width,
          dimensions.height,
          savedFileInfo.sha256,
          req.adminId
        ]
      );
      insertResult = result;
    } catch (dbErr) {
      // Rollback orphaned file on disk if database insertion fails
      if (savedFileInfo && fs.existsSync(savedFileInfo.absolutePath)) {
        try { fs.unlinkSync(savedFileInfo.absolutePath); } catch (_) {}
      }
      throw dbErr;
    }

    return res.status(201).json({
      ok: true,
      success: true,
      data: {
        asset_id: insertResult.insertId,
        album_id: targetAlbumId,
        relative_path: savedFileInfo.relativePath,
        url: storage.toPublicUrl(savedFileInfo.relativePath),
        mime_type: detectedMime,
        size: savedFileInfo.byteSize,
        width: dimensions.width,
        height: dimensions.height
      }
    });
  } catch (err) {
    if (savedFileInfo && fs.existsSync(savedFileInfo.absolutePath)) {
      try { fs.unlinkSync(savedFileInfo.absolutePath); } catch (_) {}
    }
    next(err);
  }
});

module.exports = router;
