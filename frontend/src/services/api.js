/**
 * SKIT Blood Donation Campaign (BDC) — Public Website API Service
 *
 * Connected directly to the Express / MySQL backend endpoints.
 * Includes graceful fallbacks so public UI remains visually stable
 * under all network conditions.
 */


import { FAQ_DATA, getFaqsByCategory, getHomeFaqs } from '../data/faqData.js';
import { backendUrl, resolveMediaUrls } from './backend.js';

async function fetchJson(path, options = {}) {
  try {
    const res = await fetch(backendUrl(path), {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const json = resolveMediaUrls(await res.json().catch(() => null));
    return { ok: res.ok, status: res.status, ...(json || {}) };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

export const api = {
  camps: {
    getFeatured: async () => {
      const res = await fetchJson('/api/public/camp');
      if (res.ok && res.data) {
        return { success: true, data: res.data };
      }
      return { success: true, data: null };
    },

    get: async (_id) => {
      const res = await fetchJson('/api/public/camp');
      if (res.ok && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false, message: 'Camp not found.' };
    }
  },

  registrations: {
    getPublicCamp: async (_targetId) => {
      const res = await fetchJson('/api/public/camp');
      if (res.ok && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'No live camp currently active for registration.' };
    },

    register: async (payload) => {
      const res = await fetchJson('/api/registrations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return {
        success: res.ok && res.success,
        alreadyRegistered: Boolean(res.alreadyRegistered),
        message: res.message,
        data: res.data
      };
    }
  },

  content: {
    getImpact: async () => {
      const res = await fetchJson('/api/public/site');
      if (res.ok && res.data?.cms?.HOMEPAGE?.impact) {
        const imp = res.data.cms.HOMEPAGE.impact;
        return {
          success: true,
          data: {
            blood_units: imp.bloodUnits,
            donors: imp.donorsCount,
            camps_organised: imp.campsCount
          }
        };
      }
      return { success: false, data: null };
    },

    getHomepage: async () => {
      const res = await fetchJson('/api/public/site');
      if (res.ok && res.data?.cms?.HOMEPAGE) {
        return { success: true, data: res.data.cms.HOMEPAGE };
      }
      return { success: false, data: null };
    },

    getAbout: async () => {
      const res = await fetchJson('/api/public/site');
      if (res.ok && res.data?.cms?.ABOUT) {
        return { success: true, data: res.data.cms.ABOUT };
      }
      return { success: false, data: null };
    },

    getPages: async () => {
      const res = await fetchJson('/api/public/site');
      if (res.ok && res.data?.cms?.PAGES) {
        return { success: true, data: res.data.cms.PAGES };
      }
      return { success: false, data: null };
    },

    getRegistrationText: async () => {
      const res = await fetchJson('/api/public/site');
      if (res.ok && res.data?.cms?.REGISTRATION_TEXT) {
        return { success: true, data: res.data.cms.REGISTRATION_TEXT };
      }
      return { success: false, data: null };
    },

    getNotices: async () => {
      const res = await fetchJson('/api/public/site');
      if (res.ok && Array.isArray(res.data?.cms?.NOTICES?.items)) {
        return { success: true, data: res.data.cms.NOTICES.items.filter(n => n.visible) };
      }
      return { success: false, data: [] };
    }
  },

  settings: {
    getPublic: async () => {
      const res = await fetchJson('/api/public/site');
      if (res.ok && res.data?.cms?.CONTACT) {
        const c = res.data.cms.CONTACT;
        return {
          success: true,
          data: {
            site_title: c.siteTitle,
            contact_email: c.email,
            contact_phone: c.phone,
            campus_address: c.address,
            footer_tagline: c.footerTagline,
            social_links: c.socialLinks || [],
            map_embed_url: c.mapEmbedUrl,
            directions_url: c.directionsUrl,
            heading: c.heading,
            intro: c.intro
          }
        };
      }
      return { success: false, data: null };
    }
  },

  faqs: {
    getPageContent: async () => {
      const res = await fetchJson('/api/public/site');
      return { success: res.ok, data: res.data?.cms?.FAQ || {} };
    },
    getImages: async () => {
      const res = await fetchJson('/api/public/site');
      return { success: res.ok, data: res.data?.cms?.FAQ?.images || {} };
    },
    getAll: async ({ category, home } = {}) => {
      const res = await fetchJson('/api/public/site');
      let items = FAQ_DATA;
      if (res.ok && Array.isArray(res.data?.cms?.FAQ?.items)) {
        items = res.data.cms.FAQ.items;
      }

      if (home) {
        return { success: true, data: items.filter(f => f.showOnHome).slice(0, 5) };
      }
      if (category && category !== 'all') {
        return { success: true, data: items.filter(f => f.category === category && f.isActive) };
      }
      return { success: true, data: items.filter(f => f.isActive) };
    }
  },

  team: {
    getAll: async () => {
      const res = await fetchJson('/api/public/team');
      if (res.ok && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false, data: { chiefCoordinators: [], members: [], studentCoordinators: [], websiteTeam: [] } };
    }
  },

  sponsors: {
    getAll: async () => {
      const res = await fetchJson('/api/public/sponsors');
      if (res.ok && Array.isArray(res.data)) {
        return { success: true, data: res.data };
      }
      return { success: false, data: [] };
    }
  },

  gallery: {
    getAll: async (params = {}) => {
      const q = new URLSearchParams();
      if (params.albumId || params.album_id) q.append('album_id', params.albumId || params.album_id);
      if (params.page) q.append('page', params.page);
      if (params.limit) q.append('limit', params.limit);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await fetchJson(`/api/public/gallery${queryStr}`);
      if (res.ok && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false, data: { albums: [], selectedAlbum: null, categories: [], photos: [], carouselPhotos: [] } };
    },

    getAlbums: async (params = {}) => {
      const q = new URLSearchParams();
      if (params.page) q.append('page', params.page);
      if (params.limit) q.append('limit', params.limit);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await fetchJson(`/api/public/gallery/albums${queryStr}`);
      if (res.ok && res.data) return { success: true, data: res.data };
      return { success: false, data: { albums: [], total: 0 } };
    },

    getAlbum: async (albumId, params = {}) => {
      const q = new URLSearchParams();
      if (params.page) q.append('page', params.page);
      if (params.limit) q.append('limit', params.limit);
      if (params.category) q.append('category', params.category);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      const res = await fetchJson(`/api/public/gallery/albums/${albumId}${queryStr}`);
      if (res.ok && res.data) return { success: true, data: res.data };
      return { success: false, data: null };
    }
  },

  contact: {
    submit: async (formData) => {
      return fetchJson('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    }
  }
};
