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
export function useImpactData() {
  const [impactState, setImpactState] = useState(getCachedImpactState);

  useEffect(() => {
    const unsubscribe = subscribeImpactData(setImpactState);
    refreshImpactData().catch(() => {});
    return unsubscribe;
  }, []);

  const heroStat = {
    value: impactState.data.donors.formatted,
    label: impactState.data.donors.heroLabel
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

  return {
    heroStat,
    impactStats,
    loading: impactState.loading,
    error: impactState.error,
    refresh: refreshImpactData
  };
}
