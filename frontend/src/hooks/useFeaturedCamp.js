import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api.js';

export const FEATURED_CAMP_QUERY_KEY = ['camps', 'featured'];

export async function fetchFeaturedCamp() {
  const res = await api.camps.getFeatured();
  if (!res || !res.success) {
    return null;
  }
  return res.data;
}

export function useFeaturedCamp() {
  return useQuery({
    queryKey: FEATURED_CAMP_QUERY_KEY,
    queryFn: fetchFeaturedCamp,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true
  });
}
