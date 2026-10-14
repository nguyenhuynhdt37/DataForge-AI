"use client";

import { useState, useCallback } from 'react';
import { MiningWeights } from '../types';
import { activeMiningApi } from '../services/activeMiningApi';

export const DEFAULT_WEIGHTS: MiningWeights = {
  uncertaintyMargin: 0.70,
  sliceWeight: 0.85,
  diversity: 0.60,
};

export function useActiveWeights(initialWeights: MiningWeights = DEFAULT_WEIGHTS) {
  const [weights, setWeights] = useState<MiningWeights>(initialWeights);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const updateWeights = useCallback(async (newWeights: MiningWeights) => {
    setWeights(newWeights);
    setIsSyncing(true);
    try {
      await activeMiningApi.updateWeights(newWeights);
    } catch {
      // Khi offline giữ local state
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { weights, updateWeights, isSyncing };
}
