import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

export const PUBLIC_CAMP_QUERY_KEY = ['public', 'camp'];
export const PUBLIC_GALLERY_QUERY_KEY = ['public', 'gallery'];
export const PUBLIC_TEAM_QUERY_KEY = ['public', 'team'];
export const PUBLIC_SPONSORS_QUERY_KEY = ['public', 'sponsors'];

export function usePublicCamp() {
  return useQuery({
    queryKey: PUBLIC_CAMP_QUERY_KEY,
    queryFn: async () => {
      const res = await api.camps.getFeatured();
      return res?.data || null;
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true
  });
}

export function usePublicGallery(albumId = null) {
  return useQuery({
    queryKey: albumId ? [...PUBLIC_GALLERY_QUERY_KEY, albumId] : PUBLIC_GALLERY_QUERY_KEY,
    queryFn: async () => {
      const res = await api.gallery.getAll(albumId ? { albumId } : {});
      return res?.data || { albums: [], selectedAlbum: null, categories: [], photos: [], carouselPhotos: [] };
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true
  });
}

export function usePublicTeam() {
  return useQuery({
    queryKey: PUBLIC_TEAM_QUERY_KEY,
    queryFn: async () => {
      const res = await api.team.getAll();
      return res?.data || { chiefCoordinators: [], members: [], studentCoordinators: [], websiteTeam: [] };
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true
  });
}

export function usePublicSponsors() {
  return useQuery({
    queryKey: PUBLIC_SPONSORS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.sponsors.getAll();
      return Array.isArray(res?.data) ? res.data : [];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true
  });
}
