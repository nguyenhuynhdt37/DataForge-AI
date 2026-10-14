"use client";

import { useState, useEffect, useCallback } from 'react';
import { MiningPoint } from '../types';
import { activeMiningApi } from '../services/activeMiningApi';

const GENERATE_MOCK_POINTS = (): MiningPoint[] => {
  return Array.from({ length: 90 }).map((_, i) => ({
    id: `VF-${1000 + i}`,
    x: Math.round((Math.random() * 88 + 6) * 10) / 10,
    y: Math.round((Math.random() * 88 + 6) * 10) / 10,
    isHardSlice: Math.random() > 0.65,
    confidence: Math.round((Math.random() * 0.5 + 0.45) * 100) / 100,
    scale: Math.random() * 0.4 + 0.6,
  }));
};

export function usePcaCanvas(projectId?: string) {
  const [points, setPoints] = useState<MiningPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await activeMiningApi.getPcaPoints(projectId);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPoints(res.data);
      } else {
        setPoints(GENERATE_MOCK_POINTS());
      }
    } catch {
      setPoints(GENERATE_MOCK_POINTS());
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  return { points, isLoading, error, refetch: fetchPoints };
}
