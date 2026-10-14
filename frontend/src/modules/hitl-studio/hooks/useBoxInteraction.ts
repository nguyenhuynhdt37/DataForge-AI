"use client";

import { useCallback } from 'react';
import { useHitlStore } from '../store/hitlStore';
import { BoundingBox } from '../types';

export function useBoxInteraction() {
  const {
    boxes,
    selectedBoxId,
    addBox,
    deleteBox,
    updateBoxLabel,
    setSelectedBoxId,
  } = useHitlStore();

  const handleCreateBox = useCallback((box: BoundingBox) => {
    addBox(box);
  }, [addBox]);

  const handleDeleteCurrent = useCallback(() => {
    if (selectedBoxId) {
      deleteBox(selectedBoxId);
    }
  }, [selectedBoxId, deleteBox]);

  return {
    boxes,
    selectedBoxId,
    handleCreateBox,
    handleDeleteCurrent,
    updateBoxLabel,
    setSelectedBoxId,
  };
}
