'use strict';
const crypto   = require('crypto');
const { pool } = require('../db');

/**
 * requireAuth middleware
 * Reads Authorization: Bearer <hex-token> header.
 * Validates session against admin_sessions table (not expired, not revoked,
 * session_version matches current admin record).
 * Sets req.adminId, req.adminRole on success.
 */
async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Authentication required.' });
    }

    const rawToken = auth.slice(7).trim();
    let tokenBuf;
    try {
      tokenBuf = Buffer.from(rawToken, 'hex');
      if (tokenBuf.length !== 48) throw new Error('bad length');
    } catch {
      return res.status(401).json({ ok: false, message: 'Invalid token format.' });
    }

    const tokenHash = crypto.createHash('sha256').update(tokenBuf).digest();

    // Single query: join session → admin, validate all conditions
    const [[row]] = await pool.query(
      `SELECT s.admin_id, s.session_version AS sess_ver,
              a.session_version AS curr_ver, a.role, a.is_enabled, a.must_change_password
       FROM admin_sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ?
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW(6)`,
      [tokenHash]
    );

    if (!row) {
      return res.status(401).json({ ok: false, message: 'Session expired or invalid.' });
    }

    if (!row.is_enabled) {
      return res.status(403).json({ ok: false, message: 'Account disabled.' });
    }

    // Session was issued before a password change
    if (row.sess_ver !== row.curr_ver) {
      return res.status(401).json({ ok: false, message: 'Session invalidated. Please log in again.' });
    }

    const passwordSetupRoute = req.baseUrl === '/api/auth' &&
      ((req.method === 'GET' && req.path === '/me') || (req.method === 'POST' && req.path === '/change-password'));
    if (row.must_change_password && !passwordSetupRoute) {
      return res.status(403).json({ ok: false, code: 'PASSWORD_CHANGE_REQUIRED', message: 'Change your temporary password before continuing.' });
    }
    req.adminId   = row.admin_id;
    req.adminRole = row.role;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;
