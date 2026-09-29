'use strict';
const express  = require('express');
const bcrypt   = require('bcrypt');
const crypto   = require('crypto');
const { pool } = require('../db');

const router = express.Router();
const SESSION_TTL_HOURS = 8;

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password are required.' });
    }

    // 1. Load admin by email
    const [[admin]] = await pool.query(
      'SELECT id, full_name, email, password_hash, role, is_enabled, must_change_password, session_version FROM admins WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (!admin || !admin.is_enabled) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
    }

    // 2. Verify password
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials.' });
    }

    // 3. Create session token
    const rawToken = crypto.randomBytes(48);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest();
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);

    await pool.query(
      'INSERT INTO admin_sessions (admin_id, token_hash, session_version, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(6), INTERVAL ? HOUR))',
      [admin.id, tokenHash, admin.session_version, SESSION_TTL_HOURS]
    );

    // 4. Update last_login_at
    await pool.query('UPDATE admins SET last_login_at = NOW(6) WHERE id = ?', [admin.id]);

    return res.json({
      ok: true,
      token: rawToken.toString('hex'),
      must_change_password: Boolean(admin.must_change_password),
      user: {
        id:        admin.id,
        full_name: admin.full_name,
        email:     admin.email,
        role:      admin.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(Buffer.from(token, 'hex')).digest();
      await pool.query(
        'UPDATE admin_sessions SET revoked_at = NOW(6) WHERE token_hash = ? AND revoked_at IS NULL',
        [tokenHash]
      );
    }
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', require('../middleware/requireAuth'), async (req, res, next) => {
  try {
    const { pool } = require('../db');
    const [[admin]] = await pool.query(
      'SELECT id, full_name, email, role, must_change_password, last_login_at FROM admins WHERE id = ?',
      [req.adminId]
    );
    if (!admin) return res.status(404).json({ ok: false, message: 'Not found.' });

    // Load permissions
    const [perms] = await pool.query(
      'SELECT permission_key FROM admin_permissions WHERE admin_id = ?',
      [admin.id]
    );

    return res.json({
      ok:   true,
      user: { ...admin, permissions: perms.map(p => p.permission_key) }
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/change-password ──────────────────────────────────────────
router.post('/change-password', require('../middleware/requireAuth'), async (req, res, next) => {
  try {
    // Only Super Admins may change their own password via this route.
    // Regular Admins must contact a Super Admin for a password reset.
    // Exception: must_change_password=TRUE is allowed for first-login mandatory reset.
    const [[adminRow]] = await pool.query(
      'SELECT id, password_hash, role, must_change_password FROM admins WHERE id = ?',
      [req.adminId]
    );

    if (!adminRow) return res.status(404).json({ ok: false, message: 'Account not found.' });

    // Only Super Admins may change their password via this route.
    // Regular Admins must contact a Super Admin for a password reset.
    if (adminRow.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        ok: false,
        message: 'Regular administrators cannot change their password. Please contact a Super Admin to reset your password.'
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ ok: false, message: 'New password must be at least 8 characters.' });
    }

    const valid = await bcrypt.compare(currentPassword, adminRow.password_hash);
    if (!valid) return res.status(401).json({ ok: false, message: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(newPassword, 12);

    // Bump session_version to invalidate all previous sessions
    await pool.query(
      'UPDATE admins SET password_hash = ?, must_change_password = FALSE, session_version = session_version + 1 WHERE id = ?',
      [newHash, req.adminId]
    );

    // Issue a fresh session token with the new session_version for this active client
    const [[updatedAdmin]] = await pool.query('SELECT session_version FROM admins WHERE id = ?', [req.adminId]);
    const rawToken = crypto.randomBytes(48);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest();
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000);

    await pool.query(
      'INSERT INTO admin_sessions (admin_id, token_hash, session_version, expires_at) VALUES (?, ?, ?, ?)',
      [req.adminId, tokenHash, updatedAdmin.session_version, expiresAt.toISOString().replace('T', ' ').replace('Z', '')]
    );

    return res.json({
      ok: true,
      message: 'Password updated successfully.',
      token: rawToken.toString('hex')
    });
  } catch (err) {
    next(err);
  }
});

function extractToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

module.exports = router;
