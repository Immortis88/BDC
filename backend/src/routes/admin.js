'use strict';
const express     = require('express');
const bcrypt      = require('bcrypt');
const { pool }    = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { passwordError, generatePassword } = require('../security');

const router = express.Router();
router.use(requireAuth);

const isSuperAdmin = (req) => req.adminRole === 'SUPER_ADMIN';

// ─── GET /api/admin/admins ─── Super Admin only ───────────────────────────────
router.get('/admins', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, is_enabled, must_change_password, last_login_at, created_at FROM admins WHERE deleted_at IS NULL ORDER BY id'
    );
    // Load permissions for each admin
    const [perms] = await pool.query('SELECT admin_id, permission_key FROM admin_permissions');
    const permMap = {};
    for (const p of perms) {
      if (!permMap[p.admin_id]) permMap[p.admin_id] = [];
      permMap[p.admin_id].push(p.permission_key);
    }
    const data = rows.map(a => ({
      ...a,
      is_active: Boolean(a.is_enabled), // normalized for frontend
      permissions: a.role === 'SUPER_ADMIN' ? ['*'] : (permMap[a.id] || [])
    }));
    return res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/admin/admins ── Create admin ───────────────────────────────────
router.post('/admins', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  try {
    const { full_name, email, role, temp_password, permissions } = req.body;
    if (!full_name || !email) {
      return res.status(400).json({ ok: false, message: 'full_name and email are required.' });
    }

    const initialPassword = temp_password === undefined || temp_password === '' ? generatePassword() : temp_password;
    const policyError = passwordError(initialPassword);
    if (policyError) return res.status(400).json({ ok: false, message: policyError });
    const hash = await bcrypt.hash(initialPassword, 12);
    const assignedRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'REGULAR_ADMIN';

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const mustChange = true;
      const [result] = await conn.query(
        'INSERT INTO admins (full_name, email, password_hash, role, must_change_password) VALUES (?,?,?,?,?)',
        [full_name.trim(), email.toLowerCase().trim(), hash, assignedRole, mustChange]
      );
      const newAdminId = result.insertId;

      if (assignedRole === 'REGULAR_ADMIN' && Array.isArray(permissions) && permissions.length) {
        const values = permissions.map(key => [newAdminId, key, req.adminId]);
        await conn.query('INSERT INTO admin_permissions (admin_id, permission_key, granted_by) VALUES ?', [values]);
      }

      await conn.commit();
      return res.status(201).json({
        ok: true,
        id: newAdminId,
        tempPassword: initialPassword,
        message: 'Administrator created.'
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, message: 'Email already exists.' });
    next(err);
  }
});

// ─── PATCH /api/admin/admins/:id ── Update (enable/disable, name, role) ───────
router.patch('/admins/:id', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  const conn = await pool.getConnection();
  try {
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) {
      conn.release();
      return res.status(400).json({ ok: false, message: 'Invalid admin ID.' });
    }

    const { is_enabled, is_active, full_name, role } = req.body;

    await conn.beginTransaction();

    const [[target]] = await conn.query(
      'SELECT id, role, is_enabled FROM admins WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
      [targetId]
    );
    if (!target) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: 'Admin not found.' });
    }

    // Effective enabled status
    const effectiveEnabled = typeof is_enabled === 'boolean' ? is_enabled : (typeof is_active === 'boolean' ? is_active : undefined);

    // Prevent disabling the last active non-deleted Super Admin
    if (effectiveEnabled === false && target.role === 'SUPER_ADMIN') {
      const [[{ count }]] = await conn.query(
        'SELECT COUNT(*) AS count FROM admins WHERE role = "SUPER_ADMIN" AND is_enabled = TRUE AND deleted_at IS NULL AND id != ? FOR UPDATE',
        [targetId]
      );
      if (count === 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: 'Cannot disable the last active Super Admin.' });
      }
    }

    // Prevent demoting the last active non-deleted Super Admin
    if (role === 'REGULAR_ADMIN' && target.role === 'SUPER_ADMIN') {
      const [[{ count }]] = await conn.query(
        'SELECT COUNT(*) AS count FROM admins WHERE role = "SUPER_ADMIN" AND is_enabled = TRUE AND deleted_at IS NULL AND id != ? FOR UPDATE',
        [targetId]
      );
      if (count === 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: 'Cannot demote the last active Super Admin.' });
      }
    }

    const clauses = [];
    const params = [];
    if (typeof effectiveEnabled === 'boolean') {
      clauses.push('is_enabled = ?');
      params.push(effectiveEnabled);
      // If disabled, increment session_version to immediately revoke tokens
      if (!effectiveEnabled) {
        clauses.push('session_version = session_version + 1');
      }
    }
    if (full_name) {
      clauses.push('full_name = ?');
      params.push(full_name.trim());
    }
    if (role && (role === 'SUPER_ADMIN' || role === 'REGULAR_ADMIN')) {
      clauses.push('role = ?');
      params.push(role);
    }

    if (!clauses.length) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: 'Nothing to update.' });
    }

    params.push(targetId);
    await conn.query(`UPDATE admins SET ${clauses.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);

    // If disabled, revoke active sessions
    if (effectiveEnabled === false) {
      await conn.query('UPDATE admin_sessions SET revoked_at = NOW(6) WHERE admin_id = ? AND revoked_at IS NULL', [targetId]);
    }

    await conn.commit();
    return res.json({ ok: true, message: 'Admin updated.' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

// ─── POST /api/admin/admins/:id/reset-password ───────────────────────────────
router.post('/admins/:id/reset-password', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  try {
    const targetId = Number(req.params.id);
    const [[target]] = await pool.query('SELECT id, role FROM admins WHERE id = ? AND deleted_at IS NULL', [targetId]);
    if (!target) return res.status(404).json({ ok: false, message: 'Admin not found.' });

    const { new_password } = req.body;

    const tempPassword = new_password === undefined || new_password === '' ? generatePassword() : new_password;
    const policyError = passwordError(tempPassword);
    if (policyError) return res.status(400).json({ ok: false, message: policyError });
    const hash = await bcrypt.hash(tempPassword, 12);
    const mustChange = true;

    await pool.query(
      'UPDATE admins SET password_hash = ?, must_change_password = ?, session_version = session_version + 1 WHERE id = ? AND deleted_at IS NULL',
      [hash, mustChange, targetId]
    );

    // Revoke old sessions
    await pool.query('UPDATE admin_sessions SET revoked_at = NOW(6) WHERE admin_id = ? AND revoked_at IS NULL', [targetId]);

    return res.json({
      ok: true,
      tempPassword,
      message: mustChange
        ? 'Password reset. User must change it upon next login.'
        : 'Password reset successfully.'
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/admin/admins/:id/permissions ────────────────────────────────────
router.put('/admins/:id/permissions', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  try {
    const targetId = Number(req.params.id);
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.status(400).json({ ok: false, message: 'permissions must be an array.' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[target]] = await conn.query('SELECT id FROM admins WHERE id = ? AND deleted_at IS NULL', [targetId]);
      if (!target) {
        await conn.rollback();
        return res.status(404).json({ ok: false, message: 'Admin not found.' });
      }

      await conn.query('DELETE FROM admin_permissions WHERE admin_id = ?', [targetId]);
      if (permissions.length) {
        const values = permissions.map(key => [targetId, key, req.adminId]);
        await conn.query('INSERT INTO admin_permissions (admin_id, permission_key, granted_by) VALUES ?', [values]);
      }
      await conn.commit();
      return res.json({ ok: true, message: 'Permissions updated.' });
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

// ─── DELETE /api/admin/admins/:id ── Soft-delete admin ───────────────────────
router.delete('/admins/:id', async (req, res, next) => {
  if (!isSuperAdmin(req)) return res.status(403).json({ ok: false, message: 'Super Admin only.' });
  const conn = await pool.getConnection();
  try {
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) {
      conn.release();
      return res.status(400).json({ ok: false, message: 'Invalid admin ID.' });
    }

    // Prevent self-deletion
    if (targetId === req.adminId) {
      conn.release();
      return res.status(400).json({ ok: false, message: 'You cannot delete your own account.' });
    }

    await conn.beginTransaction();

    const [[target]] = await conn.query(
      'SELECT id, role, is_enabled FROM admins WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
      [targetId]
    );
    if (!target) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: 'Admin not found.' });
    }

    // Prevent deleting the last active non-deleted Super Admin
    if (target.role === 'SUPER_ADMIN') {
      const [[{ count }]] = await conn.query(
        'SELECT COUNT(*) AS count FROM admins WHERE role = "SUPER_ADMIN" AND is_enabled = TRUE AND deleted_at IS NULL AND id != ? FOR UPDATE',
        [targetId]
      );
      if (count === 0) {
        await conn.rollback();
        return res.status(400).json({ ok: false, message: 'Cannot delete the last active Super Admin account.' });
      }
    }

    // Soft delete
    await conn.query(
      'UPDATE admins SET deleted_at = NOW(6), is_enabled = FALSE, session_version = session_version + 1 WHERE id = ?',
      [targetId]
    );

    // Revoke all active sessions
    await conn.query(
      'UPDATE admin_sessions SET revoked_at = NOW(6) WHERE admin_id = ? AND revoked_at IS NULL',
      [targetId]
    );

    await conn.commit();
    return res.json({ ok: true, message: 'Administrator account deleted.' });
  } catch (e) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});


router.get('/permissions', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT permission_key, scope, description FROM permission_definitions ORDER BY scope, permission_key');
    return res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
