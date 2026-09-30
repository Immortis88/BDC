import { useState, useEffect } from 'react';
import {
  subscribeImpactData,
  refreshImpactData,
  getCachedImpactState
} from '../services/impactService.js';

/**
 * useImpactData Hook
 * Synchronized metrics for Hero and Our Impact sections.
 */
export function useImpactData(previewImpact = null) {
  const [impactState, setImpactState] = useState(getCachedImpactState);

  useEffect(() => {
    const unsubscribe = subscribeImpactData(setImpactState);
    refreshImpactData().catch(() => {});
    return unsubscribe;
  }, []);

  const units = previewImpact?.bloodUnits ?? impactState.data.bloodUnits.raw;
  const heroStat = {
    value: Number.isFinite(Number(units)) ? Number(units).toLocaleString() : '—',
    label: 'Units of blood collected'
  };

  const impactStats = [
    {
      id: 'blood_units',
      value: impactState.data.bloodUnits.formatted,
      raw: impactState.data.bloodUnits.raw,
      label: impactState.data.bloodUnits.label
    },
    {
      id: 'donors',
      value: impactState.data.donors.formatted,
      raw: impactState.data.donors.raw,
      label: impactState.data.donors.impactLabel
    },
    {
      id: 'camps_organised',
      value: impactState.data.campsOrganised.formatted,
      raw: impactState.data.campsOrganised.raw,
      label: impactState.data.campsOrganised.label
    }
  ];

  if (previewImpact) {
    const fields = ['bloodUnits', 'donorsCount', 'campsCount'];
    impactStats.forEach((stat, index) => {
      const value = previewImpact[fields[index]];
      if (value !== undefined && Number.isFinite(Number(value))) {
        stat.raw = Number(value);
        stat.value = stat.raw.toLocaleString() + (index < 2 && stat.raw !== 0 ? '+' : '');
      }
    });
  }

  return {
    heroStat,
    impactStats,
    loading: impactState.loading,
    error: impactState.error,
    refresh: refreshImpactData
  };
}
