import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminAuthContext = createContext(null);
const TOKEN_KEY = 'bdc_admin_token_v1';
const USER_KEY  = 'bdc_admin_user_v1';

// ─── API helper ───────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({ ok: false, message: 'Server error.' }));
  return { status: res.status, ...data };
}

export function AdminAuthProvider({ children }) {
  const [user, setUser]           = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [liveCampId, setLiveCampId] = useState(null);
  const [loading, setLoading]     = useState(false);
  // Start as true so we can verify token on mount before rendering protected routes
  const [bootstrapped, setBootstrapped] = useState(false);

  // ── On mount: verify stored token is still valid ────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setBootstrapped(true);
      return;
    }
    apiFetch('/api/auth/me').then(res => {
      if (res.ok && res.user) {
        setUser(res.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      } else {
        // Token invalid/expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      }
    }).catch(() => {
      // Backend unreachable — keep user cached so UI doesn't flicker offline
    }).finally(() => {
      setBootstrapped(true);
    });
  }, []);

  // ── Fetch live camp id from site_state ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    apiFetch('/api/camps/site-state').then(res => {
      if (res.ok) setLiveCampId(res.live_camp_id ?? null);
    }).catch(() => {});
  }, [user]);

  // ── login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.ok && res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        const userData = { ...res.user, must_change_password: res.must_change_password };
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: res.message || 'Invalid email or password.' };
    } catch {
      return { success: false, message: 'Cannot reach the server. Is the backend running?' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ── logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setLiveCampId(null);
  }, []);

  // ── change password ─────────────────────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (res.ok) {
      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
      }
      // Bump local user so must_change_password flag clears
      const updated = { ...user, must_change_password: false };
      setUser(updated);
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
    return { success: res.ok, message: res.message };
  }, [user]);

  // ── permission check ────────────────────────────────────────────────────────
  const hasPermission = useCallback((permKey, campId = null) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (permKey === 'admin.roles') return false;
    if (permKey.startsWith('camp.') && campId !== null && Number(campId) !== Number(liveCampId)) {
      return false;
    }
    return (user.permissions || []).includes(permKey);
  }, [user, liveCampId]);

  return (
    <AdminAuthContext.Provider value={{
      user,
      loading,
      bootstrapped,
      liveCampId,
      setLiveCampId,
      login,
      logout,
      changePassword,
      hasPermission,
      isSuperAdmin: user?.role === 'SUPER_ADMIN'
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
