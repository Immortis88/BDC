import { api } from './api.js';

/**
 * Consolidated Impact Metrics & Authority Service
 * Single source of truth for impact statistics displayed across public pages.
 */

export const CONSOLIDATED_IMPACT_BASELINE = Object.freeze({
  bloodUnits: {
    raw: 1200,
    formatted: '1,200+',
    label: 'Blood Unit Collected During BDC'
  },
  donors: {
    raw: 2500,
    formatted: '2,500+',
    heroLabel: 'Donors across our camps',
    impactLabel: 'Live Donors Arranged By SKIT Blood Army'
  },
  campsOrganised: {
    raw: 24,
    formatted: '24+',
    label: 'Camps Organised'
  }
});

export function formatMetricCount(value, suffix = '+') {
  if (value === 0 || value === '0') return '0';
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return `${value.toLocaleString()}${suffix}`;
  }
  return String(value);
}

let cachedImpactState = {
  loading: false,
  error: null,
  data: { ...CONSOLIDATED_IMPACT_BASELINE },
  lastFetchedAt: Date.now()
};

const subscribers = new Set();

function notifySubscribers() {
  subscribers.forEach((callback) => {
    try {
      callback(cachedImpactState);
    } catch {
      // Ignore subscriber errors
    }
  });
}

export function subscribeImpactData(callback) {
  subscribers.add(callback);
  callback(cachedImpactState);
  return () => subscribers.delete(callback);
}

export async function refreshImpactData() {
  cachedImpactState = { ...cachedImpactState, loading: true, error: null };
  notifySubscribers();

  try {
    const res = await api.content.getImpact();
    if (res && res.success && res.data) {
      const liveData = res.data;
      cachedImpactState = {
        loading: false,
        error: null,
        lastFetchedAt: Date.now(),
        data: {
          bloodUnits: {
            raw: liveData.blood_units ?? CONSOLIDATED_IMPACT_BASELINE.bloodUnits.raw,
            formatted: formatMetricCount(liveData.blood_units, '+') !== '—'
              ? formatMetricCount(liveData.blood_units, '+')
              : CONSOLIDATED_IMPACT_BASELINE.bloodUnits.formatted,
            label: 'Blood Unit Collected During BDC'
          },
          donors: {
            raw: liveData.donors ?? CONSOLIDATED_IMPACT_BASELINE.donors.raw,
            formatted: liveData.donors !== undefined && liveData.donors !== null
              ? formatMetricCount(liveData.donors, '+')
              : CONSOLIDATED_IMPACT_BASELINE.donors.formatted,
            heroLabel: 'Donors across our camps',
            impactLabel: 'Live Donors Arranged By SKIT Blood Army'
          },
          campsOrganised: {
            raw: liveData.camps_organised ?? CONSOLIDATED_IMPACT_BASELINE.campsOrganised.raw,
            formatted: formatMetricCount(liveData.camps_organised, '+') !== '—'
              ? formatMetricCount(liveData.camps_organised, '+')
              : CONSOLIDATED_IMPACT_BASELINE.campsOrganised.formatted,
            label: 'Camps Organised'
          }
        }
      };
    }
  } catch {
    cachedImpactState = {
      ...cachedImpactState,
      loading: false,
      data: { ...CONSOLIDATED_IMPACT_BASELINE }
    };
  }

  notifySubscribers();
  return cachedImpactState;
}

export function getCachedImpactState() {
  return cachedImpactState;
}
