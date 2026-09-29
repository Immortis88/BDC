'use strict';
const express     = require('express');
const crypto      = require('crypto');
const { pool }    = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

const isSuperAdmin = (req) => req.adminRole === 'SUPER_ADMIN';

// ─── POST /api/contact ── PUBLIC contact form submission ─────────────────────
router.post('/contact', async (req, res, next) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ ok: false, message: 'Please enter your full name (minimum 2 characters).' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ ok: false, message: 'Please enter a valid email address.' });
    }
    if (!subject || subject.trim().length < 3) {
      return res.status(400).json({ ok: false, message: 'Please enter a subject (minimum 3 characters).' });
    }
    if (!message || message.trim().length < 10) {
      return res.status(400).json({ ok: false, message: 'Please enter a detailed message (minimum 10 characters).' });
    }

    const subKey = `${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const subHash = crypto.createHash('sha256').update(subKey).digest();
    const payHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest();

    const [result] = await pool.query(
      `INSERT INTO contact_messages (submission_key_hash, payload_hash, full_name, email, phone, subject, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        subHash,
        payHash,
        fullName.trim(),
        email.toLowerCase().trim(),
        phone?.trim() || null,
        subject.trim(),
        message.trim()
      ]
    );

    return res.status(201).json({
      ok: true,
      success: true,
      id: result.insertId,
      message: 'Thank you! Your inquiry has been delivered to the BDC coordination team.'
    });
  } catch (err) {
    next(err);
  }
});

// ─── ADMIN INBOX ROUTES (Require Auth & inbox.read permission) ─────────────────
async function checkInboxPermission(req, res, next) {
  if (isSuperAdmin(req)) return next();
  const [[grant]] = await pool.query(
    'SELECT 1 FROM admin_permissions WHERE admin_id = ? AND permission_key = "inbox.read"',
    [req.adminId]
  );
  if (!grant) return res.status(403).json({ ok: false, message: 'Access denied: inbox.read permission required.' });
  next();
}

// ─── GET /api/inbox ── Read-only messages list ───────────────────────────────
router.get('/inbox', requireAuth, checkInboxPermission, async (req, res, next) => {
  try {
    const { search, filter } = req.query; // filter: 'ALL' | 'UNREAD' | 'READ'

    const [rows] = await pool.query(
      `SELECT m.id, m.full_name, m.email, m.phone, m.subject, m.message, m.created_at,
              r.first_read_at,
              CASE WHEN r.first_read_at IS NOT NULL THEN 1 ELSE 0 END AS is_read
       FROM contact_messages m
       LEFT JOIN contact_message_reads r ON r.message_id = m.id AND r.admin_id = ?
       WHERE m.deleted_at IS NULL
       ORDER BY m.created_at DESC`,
      [req.adminId]
    );

    let filtered = rows;
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(m =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.message?.toLowerCase().includes(q)
      );
    }

    if (filter === 'UNREAD') {
      filtered = filtered.filter(m => !m.is_read);
    } else if (filter === 'READ') {
      filtered = filtered.filter(m => m.is_read);
    }

    return res.json({
      ok: true,
      success: true,
      data: filtered.map(m => ({
        id: m.id,
        full_name: m.full_name,
        email: m.email,
        phone: m.phone,
        sender_name: m.full_name,
        sender_email: m.email,
        sender_phone: m.phone,
        subject: m.subject,
        message: m.message,
        created_at: m.created_at,
        is_read: Boolean(m.is_read),
        read_at: m.first_read_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/inbox/:id/read ── Mark message as read / unread ──────────────
router.patch('/inbox/:id/read', requireAuth, checkInboxPermission, async (req, res, next) => {
  try {
    const messageId = Number(req.params.id);
    if (isNaN(messageId)) return res.status(400).json({ ok: false, message: 'Invalid message ID.' });

    const isRead = req.body?.read !== undefined ? Boolean(req.body.read) : true;

    if (isRead) {
      await pool.query(
        `INSERT INTO contact_message_reads (message_id, admin_id, first_read_at)
         VALUES (?, ?, NOW(6))
         ON DUPLICATE KEY UPDATE first_read_at = first_read_at`,
        [messageId, req.adminId]
      );
    } else {
      await pool.query(
        'DELETE FROM contact_message_reads WHERE message_id = ? AND admin_id = ?',
        [messageId, req.adminId]
      );
    }

    return res.json({ ok: true, success: true, message: isRead ? 'Message marked as read.' : 'Message marked as unread.' });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/inbox/:id ── Super Admin soft-delete ────────────────────────
router.delete('/inbox/:id', requireAuth, async (req, res, next) => {
  if (!isSuperAdmin(req)) {
    return res.status(403).json({ ok: false, message: 'Only Super Admins can delete contact messages.' });
  }
  try {
    const messageId = Number(req.params.id);
    if (isNaN(messageId)) return res.status(400).json({ ok: false, message: 'Invalid message ID.' });

    const [[msg]] = await pool.query('SELECT id FROM contact_messages WHERE id = ? AND deleted_at IS NULL', [messageId]);
    if (!msg) return res.status(404).json({ ok: false, message: 'Message not found.' });

    await pool.query('UPDATE contact_messages SET deleted_at = NOW(6) WHERE id = ?', [messageId]);
    return res.json({ ok: true, success: true, message: 'Message deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
