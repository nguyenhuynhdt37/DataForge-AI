"use client";

import { create } from 'zustand';
import { BoundingBox, HitlFrameTask } from '../types';

interface HitlStoreState {
  currentTask: HitlFrameTask | null;
  boxes: BoundingBox[];
  history: BoundingBox[][];
  historyIndex: number;
  selectedBoxId: string | null;
  activeTool: 'select' | 'bbox';
  activeClass: string;
  isChatOpen: boolean;

  setCurrentTask: (task: HitlFrameTask) => void;
  setBoxes: (boxes: BoundingBox[]) => void;
  addBox: (box: BoundingBox) => void;
  deleteBox: (id: string) => void;
  updateBoxLabel: (id: string, newLabel: string) => void;
  setSelectedBoxId: (id: string | null) => void;
  setActiveTool: (tool: 'select' | 'bbox') => void;
  setActiveClass: (classId: string) => void;
  toggleChat: () => void;
  undo: () => void;
  redo: () => void;
}

export const useHitlStore = create<HitlStoreState>((set, get) => ({
  currentTask: null,
  boxes: [],
  history: [[]],
  historyIndex: 0,
  selectedBoxId: null,
  activeTool: 'select',
  activeClass: 'car',
  isChatOpen: true,

  setCurrentTask: (task) => {
    set({
      currentTask: task,
      boxes: task.boxes || [],
      history: [task.boxes || []],
      historyIndex: 0,
      selectedBoxId: null,
    });
  },

  setBoxes: (boxes) => {
    const { history, historyIndex } = get();
    const newHistory = [...history.slice(0, historyIndex + 1), boxes];
    set({
      boxes,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  addBox: (box) => {
    const { boxes } = get();
    const nextBoxes = [...boxes, box];
    get().setBoxes(nextBoxes);
    set({ selectedBoxId: box.id });
  },

  deleteBox: (id) => {
    const { boxes, selectedBoxId } = get();
    const nextBoxes = boxes.filter((b) => b.id !== id);
    get().setBoxes(nextBoxes);
    if (selectedBoxId === id) {
      set({ selectedBoxId: null });
    }
  },

  updateBoxLabel: (id, newLabel) => {
    const { boxes } = get();
    const nextBoxes = boxes.map((b) => (b.id === id ? { ...b, label: newLabel } : b));
    get().setBoxes(nextBoxes);
  },

  setSelectedBoxId: (id) => set({ selectedBoxId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveClass: (classId) => set({ activeClass: classId }),
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      set({
        historyIndex: prevIndex,
        boxes: history[prevIndex],
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      set({
        historyIndex: nextIndex,
        boxes: history[nextIndex],
      });
    }
  },
}));
