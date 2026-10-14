"use client";

import { useState, useCallback } from 'react';

export function useCanvasTransform() {
  const [scale, setScale] = useState<number>(1.0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const resetTransform = useCallback(() => {
    setScale(1.0);
    setOffset({ x: 0, y: 0 });
  }, []);

  return { scale, offset, zoomIn, zoomOut, resetTransform, setOffset };
}
