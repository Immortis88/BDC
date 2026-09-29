'use strict';
const express  = require('express');
const { pool } = require('../db');
const storage  = require('../storage');

const router = express.Router();

async function getLiveCampId() {
  const [[row]] = await pool.query('SELECT live_camp_id FROM site_state WHERE id = 1');
  return row?.live_camp_id ?? null;
}

function formatTime12(timeStr) {
  if (!timeStr) return '';
  const match = String(timeStr).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function formatOperatingHours(startsAt, endsAt, tz = 'IST') {
  if (!startsAt || !endsAt) return '';
  const start = formatTime12(startsAt);
  const end = formatTime12(endsAt);
  if (!start || !end) return '';
  return `${start} – ${end}${tz ? ` ${tz}` : ''}`;
}

// ─── GET /api/public/site ── Core site info, live camp, contact, impact ──────
router.get('/site', async (req, res, next) => {
  try {
    const liveCampId = await getLiveCampId();
    let liveCamp = null;

    if (liveCampId) {
      const [[camp]] = await pool.query(
        'SELECT id, camp_year, internal_name, public_title, description, camp_date, starts_at, ends_at, venue, venue_subtitle, registration_open FROM camps WHERE id = ? AND deleted_at IS NULL',
        [liveCampId]
      );
      if (camp) {
        const [vis] = await pool.query('SELECT page_key, is_visible FROM camp_page_visibility WHERE camp_id = ?', [liveCampId]);
        const visibility = { team: true, gallery: true, sponsors: true, registration: true };
        for (const v of vis) visibility[v.page_key] = Boolean(v.is_visible);

        liveCamp = {
          ...camp,
          is_registration_available: Boolean(camp.registration_open),
          visibility
        };
      }
    }

    // Load published CMS publications
    const [pubs] = await pool.query(
      `SELECT p.area, r.payload
       FROM cms_publications p
       JOIN cms_revisions r ON r.id = p.published_revision_id`
    );

    const cms = {};
    for (const p of pubs) {
      let val = p.payload;
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch {}
      }
      cms[p.area] = val;
    }

    return res.json({
      ok: true,
      success: true,
      data: {
        liveCamp,
        cms
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/public/camp ── Live camp details for registration / home ────────
router.get('/camp', async (req, res, next) => {
  try {
    const liveCampId = await getLiveCampId();
    if (!liveCampId) {
      return res.json({ ok: true, success: true, data: null });
    }

    const [[camp]] = await pool.query(
        'SELECT id, camp_year, internal_name, public_title, description, camp_date, starts_at, ends_at, venue, venue_subtitle, registration_open FROM camps WHERE id = ? AND deleted_at IS NULL',
      [liveCampId]
    );

    if (!camp) return res.json({ ok: true, success: true, data: null });

    const [visibilityRows] = await pool.query(
      'SELECT page_key, is_visible FROM camp_page_visibility WHERE camp_id = ?',
      [liveCampId]
    );
    const visibility = { team: true, gallery: true, sponsors: true, registration: true };
    for (const row of visibilityRows) visibility[row.page_key] = Boolean(row.is_visible);

    return res.json({
      ok: true,
      success: true,
      data: {
        _id: `camp-${camp.camp_year}-1`,
        id: camp.id,
        name: camp.public_title,
        year: camp.camp_year,
        camp_date: camp.camp_date,
        camp_time: formatOperatingHours(camp.starts_at, camp.ends_at, 'IST'),
        venue: camp.venue,
        venue_sub: camp.venue_subtitle,
        registration_open: Boolean(camp.registration_open),
        is_registration_available: Boolean(camp.registration_open),
        visibility
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/public/team ── Public Team Page & Homepage Team ────────────────
router.get('/team', async (req, res, next) => {
  try {
    const websiteTeam = await require('../websiteTeam').getWebsiteTeam();
    const liveCampId = await getLiveCampId();
    if (!liveCampId) {
      return res.json({ ok: true, success: true, data: { chiefCoordinators: [], members: [], studentCoordinators: [], websiteTeam } });
    }

    // Check camp_page_visibility
    const [[vis]] = await pool.query('SELECT is_visible FROM camp_page_visibility WHERE camp_id = ? AND page_key = "team"', [liveCampId]);
    if (vis && !vis.is_visible) {
      return res.json({ ok: true, success: true, data: { chiefCoordinators: [], members: [], studentCoordinators: [], websiteTeam } });
    }

    const [rows] = await pool.query(
      `SELECT t.id, t.group_key, t.full_name, t.role_label, t.phone, t.show_phone_publicly,
              a.relative_path AS photo_path
       FROM team_members t
       LEFT JOIN media_assets a ON a.id = t.photo_asset_id
       WHERE t.camp_id = ? AND t.is_visible = TRUE
       ORDER BY t.sort_order, t.id`,
      [liveCampId]
    );

    const chiefCoordinators = [];
    const members = [];
    const studentCoordinators = [];

    for (const r of rows) {
      const item = {
        name: r.full_name,
        role: (r.role_label || '').trim(),
        phone: r.show_phone_publicly ? r.phone : null,
        photoUrl: r.photo_path ? `/media/${r.photo_path}` : null
      };

      if (r.group_key === 'CHIEF_COORDINATOR') {
        chiefCoordinators.push(item);
      } else if (r.group_key === 'MEMBERS') {
        members.push(item);
      } else if (r.group_key === 'STUDENT_COORDINATORS') {
        studentCoordinators.push(item);

      }
    }

    return res.json({
      ok: true,
      success: true,
      data: {
        chiefCoordinators,
        members,
        studentCoordinators,
        websiteTeam
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/public/sponsors ── Public Supporters Page & Homepage strip ─────
router.get('/sponsors', async (req, res, next) => {
  try {
    const liveCampId = await getLiveCampId();
    if (!liveCampId) {
      return res.json({ ok: true, success: true, data: [] });
    }

    // Check camp_page_visibility
    const [[vis]] = await pool.query('SELECT is_visible FROM camp_page_visibility WHERE camp_id = ? AND page_key = "sponsors"', [liveCampId]);
    if (vis && !vis.is_visible) {
      return res.json({ ok: true, success: true, data: [] });
    }

    const [sections] = await pool.query(
      'SELECT id, heading, description FROM sponsor_sections WHERE camp_id = ? ORDER BY sort_order, id',
      [liveCampId]
    );

    const [sponsors] = await pool.query(
      `SELECT s.id, s.section_id, s.name, s.website_url, a.relative_path AS logo_path
       FROM sponsors s
       JOIN sponsor_sections sec ON sec.id = s.section_id
       LEFT JOIN media_assets a ON a.id = s.logo_asset_id
       WHERE sec.camp_id = ?
       ORDER BY s.sort_order, s.id`,
      [liveCampId]
    );

    const spMap = {};
    for (const sp of sponsors) {
      if (!spMap[sp.section_id]) spMap[sp.section_id] = [];
      spMap[sp.section_id].push({
        name: sp.name,
        website_url: sp.website_url,
        logoUrl: sp.logo_path ? `/media/${sp.logo_path}` : null
      });
    }

    const data = sections.map(sec => ({
      heading: sec.heading,
      description: sec.description,
      sponsors: spMap[sec.id] || []
    })).filter(s => s.sponsors.length > 0);

    return res.json({ ok: true, success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/public/gallery/albums ── Published Albums List ─────────────────
router.get('/gallery/albums', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM gallery_albums WHERE is_published = 1'
    );

    const [albums] = await pool.query(
      `SELECT a.id, a.title, a.description, a.camp_year, a.camp_date, a.camp_id,
              a.cover_asset_id, a.sort_order,
              ma.relative_path AS cover_relative_path,
              (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id = a.id AND p.is_visible = 1) AS photo_count,
              (SELECT COUNT(*) FROM gallery_categories cat WHERE cat.album_id = a.id) AS category_count
       FROM gallery_albums a
       LEFT JOIN media_assets ma ON ma.id = a.cover_asset_id
       WHERE a.is_published = 1
       ORDER BY a.sort_order ASC, a.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const formatted = albums.map(a => ({
      id: Number(a.id),
      title: a.title,
      description: a.description,
      camp_year: a.camp_year,
      camp_date: a.camp_date,
      camp_id: a.camp_id ? Number(a.camp_id) : null,
      cover_asset_id: a.cover_asset_id ? Number(a.cover_asset_id) : null,
      cover_url: a.cover_relative_path ? storage.toPublicUrl(a.cover_relative_path) : null,
      photo_count: Number(a.photo_count || 0),
      category_count: Number(a.category_count || 0),
      sort_order: Number(a.sort_order)
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

// ─── GET /api/public/gallery/albums/:id ── Single Album Photos & Categories ───
router.get('/gallery/albums/:id', async (req, res, next) => {
  try {
    const albumId = Number(req.params.id);
    if (!albumId || isNaN(albumId)) {
      return res.status(400).json({ ok: false, message: 'Valid numeric albumId is required.' });
    }

    const [[album]] = await pool.query(
      `SELECT a.id, a.title, a.description, a.camp_year, a.camp_date, a.camp_id,
              a.cover_asset_id, a.sort_order,
              ma.relative_path AS cover_relative_path
       FROM gallery_albums a
       LEFT JOIN media_assets ma ON ma.id = a.cover_asset_id
       WHERE a.id = ? AND a.is_published = 1`,
      [albumId]
    );

    if (!album) {
      return res.status(404).json({ ok: false, message: 'Published gallery album not found.' });
    }

    const category = (req.query.category || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const offset = (page - 1) * limit;

    // Categories in this album
    const [catRows] = await pool.query(
      'SELECT name FROM gallery_categories WHERE album_id = ? ORDER BY sort_order ASC, name ASC',
      [album.id]
    );
    const categories = catRows.map(r => r.name);

    let whereSql = 'WHERE p.album_id = ? AND p.is_visible = 1';
    const params = [album.id];
    if (category && category !== 'All') {
      whereSql += ' AND p.category = ?';
      params.push(category);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM gallery_photos p ${whereSql}`,
      params
    );

    const [photoRows] = await pool.query(
      `SELECT p.id, p.category, p.alt_text, p.caption, p.sort_order, ma.relative_path
       FROM gallery_photos p
       LEFT JOIN media_assets ma ON ma.id = p.asset_id
       ${whereSql}
       ORDER BY p.sort_order ASC, p.id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const photos = photoRows.map(p => ({
      id: Number(p.id),
      category: p.category,
      alt_text: p.alt_text,
      caption: p.caption,
      sort_order: Number(p.sort_order),
      photo_url: p.relative_path ? storage.toPublicUrl(p.relative_path) : null,
      photoUrl: p.relative_path ? storage.toPublicUrl(p.relative_path) : null
    }));

    return res.json({
      ok: true,
      success: true,
      data: {
        album: {
          id: Number(album.id),
          title: album.title,
          description: album.description,
          camp_year: album.camp_year,
          camp_date: album.camp_date,
          cover_url: album.cover_relative_path ? storage.toPublicUrl(album.cover_relative_path) : null
        },
        categories,
        photos,
        total,
        page,
        limit
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/public/gallery ── Global Gallery & Homepage Carousel Contract ───
router.get('/gallery', async (req, res, next) => {
  try {
    // 1. All published albums
    const [publishedAlbums] = await pool.query(
      `SELECT a.id, a.title, a.description, a.camp_year, a.camp_date, a.camp_id,
              a.cover_asset_id, a.sort_order,
              ma.relative_path AS cover_relative_path,
              (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id = a.id AND p.is_visible = 1) AS photo_count,
              (SELECT COUNT(*) FROM gallery_categories cat WHERE cat.album_id = a.id) AS category_count
       FROM gallery_albums a
       LEFT JOIN media_assets ma ON ma.id = a.cover_asset_id
       WHERE a.is_published = 1
       ORDER BY a.sort_order ASC, a.id DESC`
    );

    const formattedAlbums = publishedAlbums.map(a => ({
      id: Number(a.id),
      title: a.title,
      description: a.description,
      camp_year: a.camp_year,
      camp_date: a.camp_date,
      camp_id: a.camp_id ? Number(a.camp_id) : null,
      cover_asset_id: a.cover_asset_id ? Number(a.cover_asset_id) : null,
      cover_url: a.cover_relative_path ? storage.toPublicUrl(a.cover_relative_path) : null,
      photo_count: Number(a.photo_count || 0),
      category_count: Number(a.category_count || 0),
      sort_order: Number(a.sort_order)
    }));

    // 2. Select target album: query param or first published album
    let selectedAlbum = null;
    const requestedAlbumId = Number(req.query.album_id || req.query.albumId);
    if (requestedAlbumId) {
      selectedAlbum = formattedAlbums.find(a => a.id === requestedAlbumId) || null;
    }
    if (!selectedAlbum && formattedAlbums.length > 0) {
      selectedAlbum = formattedAlbums[0];
    }

    let albumPhotos = [];
    let albumCategories = [];

    if (selectedAlbum) {
      const [catRows] = await pool.query(
        'SELECT name FROM gallery_categories WHERE album_id = ? ORDER BY sort_order ASC, name ASC',
        [selectedAlbum.id]
      );
      albumCategories = catRows.map(r => r.name);

      const [pRows] = await pool.query(
        `SELECT p.id, p.category, p.alt_text, p.caption, p.sort_order, ma.relative_path
         FROM gallery_photos p
         LEFT JOIN media_assets ma ON ma.id = p.asset_id
         WHERE p.album_id = ? AND p.is_visible = 1
         ORDER BY p.sort_order ASC, p.id ASC`,
        [selectedAlbum.id]
      );

      albumPhotos = pRows.map(p => {
        const url = p.relative_path ? storage.toPublicUrl(p.relative_path) : null;
        return {
          id: Number(p.id),
          category: p.category,
          alt_text: p.alt_text,
          caption: p.caption,
          sort_order: Number(p.sort_order),
          photo_url: url,
          photoUrl: url,
          image_url: url
        };
      });
    }

    // 3. Homepage Carousel: Bounded (16) deterministically ordered visible photos
    // Ordered by album sort_order ASC, then photo sort_order ASC
    const [carouselRows] = await pool.query(
      `SELECT p.id, p.category, p.alt_text, p.caption, p.sort_order, ma.relative_path
       FROM gallery_photos p
       JOIN gallery_albums a ON a.id = p.album_id
       LEFT JOIN media_assets ma ON ma.id = p.asset_id
       WHERE a.is_published = 1 AND p.is_visible = 1
       ORDER BY a.sort_order ASC, a.id DESC, p.sort_order ASC, p.id ASC
       LIMIT 16`
    );

    const carouselPhotos = carouselRows.map(p => {
      const url = p.relative_path ? storage.toPublicUrl(p.relative_path) : null;
      return {
        id: Number(p.id),
        category: p.category,
        alt_text: p.alt_text,
        caption: p.caption,
        photo_url: url,
        photoUrl: url,
        image_url: url
      };
    });

    // 4. Live Camp Info for backward-compatibility with test suites
    let currentCampInfo = null;
    const liveCampId = await getLiveCampId();
    if (liveCampId) {
      const [[camp]] = await pool.query('SELECT id, camp_year, public_title, camp_date, starts_at, ends_at, venue, venue_subtitle FROM camps WHERE id = ? AND deleted_at IS NULL', [liveCampId]);
      if (camp) {
        currentCampInfo = {
          editionLabel: camp.public_title,
          date: camp.camp_date,
          time: formatOperatingHours(camp.starts_at, camp.ends_at, 'IST'),
          venue: camp.venue,
          venueSub: camp.venue_subtitle
        };
      }
    }

    return res.json({
      ok: true,
      success: true,
      data: {
        albums: formattedAlbums,
        selectedAlbum,
        categories: albumCategories,
        photos: albumPhotos,
        carouselPhotos,
        currentCamp: currentCampInfo
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
