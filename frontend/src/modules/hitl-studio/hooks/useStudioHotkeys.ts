"use client";

import { useEffect } from 'react';
import { useHitlStore } from '../store/hitlStore';
import { LABEL_CLASSES } from '../components/LabelToolbar';

interface UseStudioHotkeysOptions {
  onSaveAndNext?: () => void;
}

export function useStudioHotkeys({ onSaveAndNext }: UseStudioHotkeysOptions = {}) {
  const {
    activeTool,
    setActiveTool,
    setActiveClass,
    selectedBoxId,
    deleteBox,
    setSelectedBoxId,
    undo,
    redo,
  } = useHitlStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua khi đang gõ vào input chat hoặc text input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Space: Lưu & Tiếp tục
      if (e.code === 'Space') {
        e.preventDefault();
        onSaveAndNext?.();
        return;
      }

      // Delete hoặc Backspace: Xóa box được chọn
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBoxId) {
        e.preventDefault();
        deleteBox(selectedBoxId);
        return;
      }

      // Escape: Bỏ chọn
      if (e.key === 'Escape') {
        setSelectedBoxId(null);
        return;
      }

      // V / B: Tool switch
      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        setActiveTool('bbox');
        return;
      }

      // 1 - 6: Class switch
      const foundClass = LABEL_CLASSES.find((c) => c.key === e.key);
      if (foundClass) {
        setActiveClass(foundClass.id);
        return;
      }

      // Ctrl+Z / Ctrl+Y
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTool,
    selectedBoxId,
    setActiveTool,
    setActiveClass,
    deleteBox,
    setSelectedBoxId,
    undo,
    redo,
    onSaveAndNext,
  ]);
}
