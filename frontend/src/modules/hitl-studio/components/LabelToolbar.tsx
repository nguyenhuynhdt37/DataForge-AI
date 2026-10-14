"use client";

import React from 'react';
import { MousePointer2, Square, Eye, Undo, Redo } from 'lucide-react';

export interface LabelClass {
  id: string;
  name: string;
  color: string;
  key: string;
}

export const LABEL_CLASSES: LabelClass[] = [
  { id: 'car', name: 'Car / Ô tô điện', color: 'border-emerald-500 bg-emerald-500/20 text-emerald-300', key: '1' },
  { id: 'motorbike', name: 'Motorbike / Xe máy', color: 'border-amber-500 bg-amber-500/20 text-amber-300', key: '2' },
  { id: 'pedestrian', name: 'Pedestrian / Người', color: 'border-blue-500 bg-blue-500/20 text-blue-300', key: '3' },
  { id: 'truck', name: 'Truck / Xe tải', color: 'border-purple-500 bg-purple-500/20 text-purple-300', key: '4' },
  { id: 'bus', name: 'Bus / Xe buýt điện', color: 'border-rose-500 bg-rose-500/20 text-rose-300', key: '5' },
  { id: 'traffic_sign', name: 'Traffic Sign / Biển báo', color: 'border-cyan-500 bg-cyan-500/20 text-cyan-300', key: '6' },
];

interface LabelToolbarProps {
  activeTool: 'select' | 'bbox';
  onToolChange: (tool: 'select' | 'bbox') => void;
  activeClass: string;
  onClassChange: (classId: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const LabelToolbar: React.FC<LabelToolbarProps> = ({
  activeTool,
  onToolChange,
  activeClass,
  onClassChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}) => {
  return (
    <div className="flex items-center gap-3 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl">
      {/* Tool Selector */}
      <div className="flex items-center gap-1 border-r border-zinc-800 pr-2">
        <button
          type="button"
          onClick={() => onToolChange('select')}
          title="Chọn & Di chuyển (V)"
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            activeTool === 'select'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <MousePointer2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onToolChange('bbox')}
          title="Vẽ Bounding Box (B)"
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            activeTool === 'bbox'
              ? 'bg-emerald-500 text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Square className="h-4 w-4" />
        </button>
      </div>

      {/* Class Selector with Hotkeys 1-6 */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {LABEL_CLASSES.map((cls) => {
          const isSelected = activeClass === cls.id;
          return (
            <button
              key={cls.id}
              type="button"
              onClick={() => onClassChange(cls.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? `${cls.color} ring-2 ring-emerald-500/30`
                  : 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{cls.name}</span>
              <kbd className="text-[10px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                {cls.key}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 ml-auto">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Hoàn tác (Ctrl+Z)"
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Làm lại (Ctrl+Y)"
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
