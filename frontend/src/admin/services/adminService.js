/**
 * SKIT Blood Donation Campaign (BDC) — Real Admin API Service Client
 * Directly interacts with the Express / MySQL backend endpoints.
 */

import { backendUrl, resolveMediaUrls } from '../../services/backend.js';

const TOKEN_KEY = 'bdc_admin_token_v1';

async function request(path, options = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  const res = await fetch(backendUrl(path), config);

  if (res.status === 401) {
    // Session expired or invalid
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
      // Don't auto-redirect abruptly during page load
    }
  }

  // Handle blob or text responses (e.g. CSV exports)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
    const blob = await res.blob();
    return { ok: res.ok, success: res.ok, blob };
  }

  const json = resolveMediaUrls(await res.json().catch(() => ({ ok: false, message: 'Invalid response from server.' })));
  return {
    ...json,
    success: json.success ?? json.ok ?? res.ok
  };
}

export const adminService = {
  // ── Authentication & Administrator Management ──────────────────────────────
  auth: {
    login: async (email, password) => {
      return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    },

    getMe: async () => {
      return request('/api/auth/me');
    },

    changePassword: async (_adminId, currentPassword, newPassword) => {
      return request('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    },

    getAdmins: async () => {
      return request('/api/admin/admins');
    },

    createAdmin: async ({ full_name, email, role, permissions, temp_password }) => {
      return request('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, role, permissions, temp_password })
      });
    },

    updateAdminRole: async (adminId, role) => {
      return request(`/api/admin/admins/${adminId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
      });
    },

    toggleAdminActive: async (adminId, isActive) => {
      return request(`/api/admin/admins/${adminId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive })
      });
    },

    resetAdminPassword: async (adminId, newPassword) => {
      return request(`/api/admin/admins/${adminId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword })
      });
    },

    updateAdminPermissions: async (adminId, permissions) => {
      return request(`/api/admin/admins/${adminId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions })
      });
    },

    getPermissionDefinitions: async () => {
      return request('/api/admin/permissions');
    },

    deleteAdmin: async (adminId) => {
      return request(`/api/admin/admins/${adminId}`, {
        method: 'DELETE'
      });
    }
  },

  // ── Camps Management ────────────────────────────────────────────────────────
  camps: {
    getAll: async () => {
      return request('/api/camps');
    },

    getById: async (campId) => {
      return request(`/api/camps/${campId}`);
    },

    create: async (payload) => {
      return request('/api/camps', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    update: async (campId, payload) => {
      return request(`/api/camps/${campId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },

    delete: async (campId) => {
      return request(`/api/camps/${campId}`, { method: 'DELETE' });
    },

    setLiveCamp: async (campId) => {
      return request(`/api/camps/${campId}/set-live`, {
        method: 'POST'
      });
    },

    clearLiveCamp: async () => {
      return request('/api/camps/clear-live', {
        method: 'POST'
      });
    },

    updatePageVisibility: async (campId, pageKey, isVisible) => {
      return request(`/api/camps/${campId}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ page_key: pageKey, is_visible: isVisible })
      });
    }
  },

  // ── Team Workspace ──────────────────────────────────────────────────────────
  team: {
    updateSection: async (campId, key, payload) => {
      return request(`/api/camps/${campId}/team/sections/${key}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },
    getByCamp: async (campId) => {
      return request(`/api/camps/${campId}/team`);
    },

    create: async (campId, payload) => {
      return request(`/api/camps/${campId}/team`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    update: async (campId, memberId, payload) => {
      return request(`/api/camps/${campId}/team/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },

    delete: async (campId, memberId) => {
      return request(`/api/camps/${campId}/team/${memberId}`, {
        method: 'DELETE'
      });
    },

    reorder: async (campId, orderedIds, scope = {}) => {
      return request(`/api/camps/${campId}/team/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds, ...scope })
      });
    }
  },

  // ── Global Gallery & Albums CMS ──────────────────────────────────────────
  gallery: {
    albums: {
      getAll: async (params = {}) => {
        const q = new URLSearchParams();
        if (params.page) q.append('page', params.page);
        if (params.limit) q.append('limit', params.limit);
        if (params.search) q.append('search', params.search);
        return request(`/api/admin/gallery/albums?${q.toString()}`);
      },
      get: async (id) => {
        return request(`/api/admin/gallery/albums/${id}`);
      },
      create: async (payload) => {
        return request('/api/admin/gallery/albums', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },
      update: async (id, payload) => {
        return request(`/api/admin/gallery/albums/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      },
      delete: async (id) => {
        return request(`/api/admin/gallery/albums/${id}`, {
          method: 'DELETE'
        });
      },
      reorder: async (orderedIds, previousIds = null) => {
        return request('/api/admin/gallery/albums/reorder', {
          method: 'PUT',
          body: JSON.stringify({ orderedIds, previousIds })
        });
      }
    },

    photos: {
      getAll: async (albumId, params = {}) => {
        const q = new URLSearchParams();
        if (params.page) q.append('page', params.page);
        if (params.limit) q.append('limit', params.limit);
        if (params.category) q.append('category', params.category);
        return request(`/api/admin/gallery/albums/${albumId}/photos?${q.toString()}`);
      },
      create: async (albumId, payload) => {
        return request(`/api/admin/gallery/albums/${albumId}/photos`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },
      update: async (albumId, photoId, payload) => {
        return request(`/api/admin/gallery/albums/${albumId}/photos/${photoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      },
      delete: async (albumId, photoId) => {
        return request(`/api/admin/gallery/albums/${albumId}/photos/${photoId}`, {
          method: 'DELETE'
        });
      },
      reorder: async (albumId, orderedIds, previousIds = null) => {
        return request(`/api/admin/gallery/albums/${albumId}/photos/reorder`, {
          method: 'PUT',
          body: JSON.stringify({ orderedIds, previousIds })
        });
      }
    },

    categories: {
      getAll: async (albumId) => {
        return request(`/api/admin/gallery/albums/${albumId}/categories`);
      },
      create: async (albumId, payload) => {
        return request(`/api/admin/gallery/albums/${albumId}/categories`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      },
      update: async (albumId, categoryId, payload) => {
        return request(`/api/admin/gallery/albums/${albumId}/categories/${categoryId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      },
      delete: async (albumId, categoryId) => {
        return request(`/api/admin/gallery/albums/${albumId}/categories/${categoryId}`, {
          method: 'DELETE'
        });
      },
      reorder: async (albumId, orderedIds, previousIds = null) => {
        return request(`/api/admin/gallery/albums/${albumId}/categories/reorder`, {
          method: 'PUT',
          body: JSON.stringify({ orderedIds, previousIds })
        });
      }
    },

    // Legacy compatibility methods
    getByCamp: async (campId) => {
      return request(`/api/camps/${campId}/gallery`);
    },
    reorder: async (campId, orderedIds, scope = {}) => {
      return request(`/api/camps/${campId}/gallery/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds, ...scope })
      });
    }
  },

  // ── Sponsors Workspace ──────────────────────────────────────────────────────
  sponsors: {
    getByCamp: async (campId) => {
      return request(`/api/camps/${campId}/sponsors`);
    },

    createSection: async (campId, payload) => {
      return request(`/api/camps/${campId}/sponsors/sections`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    updateSection: async (campId, sectionId, payload) => {
      return request(`/api/camps/${campId}/sponsors/sections/${sectionId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },

    deleteSection: async (campId, sectionId, options = {}) => {
      const query = options.reassign_to_section_id ? `?reassign_to_section_id=${options.reassign_to_section_id}` : '';
      return request(`/api/camps/${campId}/sponsors/sections/${sectionId}${query}`, {
        method: 'DELETE'
      });
    },

    createSponsor: async (campId, payload) => {
      return request(`/api/camps/${campId}/sponsors`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    updateSponsor: async (campId, sponsorId, payload) => {
      return request(`/api/camps/${campId}/sponsors/${sponsorId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },

    saveSponsor: async (campId, sectionId, payload) => {
      const body = { ...payload, section_id: sectionId };
      if (payload.id) return request(`/api/camps/${campId}/sponsors/${payload.id}`, {
        method: 'PATCH', body: JSON.stringify(body)
      });
      return request(`/api/camps/${campId}/sponsors`, {
        method: 'POST', body: JSON.stringify(body)
      });
    },

    deleteSponsor: async (campId, sponsorIdOrSectionId, maybeSponsorId) => {
      const actualSponsorId = maybeSponsorId !== undefined ? maybeSponsorId : sponsorIdOrSectionId;
      return request(`/api/camps/${campId}/sponsors/${actualSponsorId}`, {
        method: 'DELETE'
      });
    },

    reorderSections: async (campId, orderedIds, scope = {}) => {
      return request(`/api/camps/${campId}/sponsors/reorder-sections`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds, ...scope })
      });
    },

    reorderSponsors: async (campId, orderedIds, scope = {}) => {
      return request(`/api/camps/${campId}/sponsors/reorder-sponsors`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds, ...scope })
      });
    }
  },

  // ── Registrations Workspace ─────────────────────────────────────────────────
  registrations: {
    getByCamp: async (campId, filters = {}, requestOptions = {}) => {
      const query = new URLSearchParams({ camp_id: campId });
      if (filters.search) query.set('search', filters.search);
      if (filters.name) query.set('name', filters.name);
      if (filters.collegeId) query.set('college_id', filters.collegeId);
      if (filters.employeeId) query.set('employee_id', filters.employeeId);
      if (filters.regId) query.set('reg_id', filters.regId);
      if (filters.blood && filters.blood !== 'ALL') query.set('blood_group', filters.blood);
      if (filters.role && filters.role !== 'ALL') query.set('role', filters.role);
      if (filters.branch && filters.branch !== 'ALL') query.set('branch', filters.branch);
      if (filters.outcome && filters.outcome !== 'ALL') query.set('outcome', filters.outcome);
      if (filters.dateFrom) query.set('date_from', filters.dateFrom);
      if (filters.dateTo) query.set('date_to', filters.dateTo);
      if (filters.page) query.set('page', filters.page);
      if (filters.limit) query.set('limit', filters.limit);

      return request(`/api/registrations?${query.toString()}`, requestOptions);
    },

    getById: async (regId) => {
      return request(`/api/registrations/${regId}`);
    },

    updateStatus: async (regId, payload) => {
      return request(`/api/registrations/${regId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },

    updateOutcome: async (regId, payload) => {
      return request(`/api/registrations/${regId}/outcome`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    },

    updateBloodGroup: async (regId, bloodGroup) => {
      return request(`/api/registrations/${regId}/blood-group`, {
        method: 'PATCH',
        body: JSON.stringify({ blood_group: bloodGroup })
      });
    },

    exportExcel: async (campId, options = {}) => {
      const query = new URLSearchParams({ camp_id: campId });
      if (options.columns && options.columns.length > 0) {
        query.set('columns', options.columns.join(','));
      }
      if (options.search) query.set('search', options.search);
      if (options.name) query.set('name', options.name);
      if (options.regId) query.set('reg_id', options.regId);
      if (options.blood && options.blood !== 'ALL') query.set('blood_group', options.blood);
      if (options.role && options.role !== 'ALL') query.set('role', options.role);
      if (options.branch && options.branch !== 'ALL') query.set('branch', options.branch);
      if (options.outcome && options.outcome !== 'ALL') query.set('outcome', options.outcome);
      if (options.dateFrom) query.set('date_from', options.dateFrom);
      if (options.dateTo) query.set('date_to', options.dateTo);

      const res = await request(`/api/registrations/export?${query.toString()}`);
      if (res.success && res.blob) {
        const url = window.URL.createObjectURL(res.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bdc_camp_${campId}_registrations.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
      }
      return res;
    }
  },

  // ── Global Website CMS ──────────────────────────────────────────────────────
  cms: {
    getArea: async (area) => {
      return request(`/api/cms/${area}/draft`);
    },

    saveDraft: async (area, payload) => {
      return request(`/api/cms/${area}/draft`, {
        method: 'POST',
        body: JSON.stringify({ payload })
      });
    },

    publishArea: async (area, payload) => {
      return request(`/api/cms/${area}/publish`, {
        method: 'POST',
        body: JSON.stringify({ payload })
      });
    },

    previewArea: async (area) => {
      return request(`/api/cms/${area}/preview`);
    }
  },

  // ── Read-Only Inbox ─────────────────────────────────────────────────────────
  inbox: {
    getAll: async ({ search, filter } = {}) => {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (filter) query.set('filter', filter);
      return request(`/api/inbox?${query.toString()}`);
    },

    markAsRead: async (messageId) => {
      return request(`/api/inbox/${messageId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true })
      });
    },

    toggleRead: async (messageId, read = true) => {
      return request(`/api/inbox/${messageId}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ read })
      });
    },

    deleteMessage: async (messageId) => {
      return request(`/api/inbox/${messageId}`, {
        method: 'DELETE'
      });
    }
  },

  // ── Media Upload ────────────────────────────────────────────────────────────
  upload: async (file, { kind = 'SITE', campId = null, albumId = null, area = null } = {}) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    if (campId) formData.append('camp_id', campId);
    if (albumId) formData.append('album_id', albumId);
    if (area) formData.append('area', area);

    const res = await fetch(backendUrl('/api/upload'), {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    const json = resolveMediaUrls(await res.json().catch(() => ({ ok: false, message: 'Upload failed.' })));
    const success = Boolean(json.success ?? json.ok ?? res.ok);
    const data = json.data || {};

    return {
      ...json,
      success,
      data,
      url: data.url || json.url || (data.relative_path ? backendUrl(`/media/${data.relative_path}`) : null),
      asset_id: data.asset_id || json.asset_id || null,
      relative_path: data.relative_path || json.relative_path || null
    };
  }
};
