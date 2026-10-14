"use client";

import React from 'react';
import { Trash2, Tag, ShieldCheck } from 'lucide-react';
import { BoundingBox } from '../types';

interface BoxPropertySidebarProps {
  boxes: BoundingBox[];
  selectedBoxId: string | null;
  onSelectBox: (id: string | null) => void;
  onDeleteBox: (id: string) => void;
  onChangeBoxLabel: (id: string, newLabel: string) => void;
}

export const BoxPropertySidebar: React.FC<BoxPropertySidebarProps> = ({
  boxes,
  selectedBoxId,
  onSelectBox,
  onDeleteBox,
  onChangeBoxLabel,
}) => {
  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Danh sách Hộp ({boxes.length})</span>
        </div>
        <span className="text-xs font-mono text-zinc-500">Auto + Human</span>
      </div>

      {/* Box List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {boxes.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            Chưa có bounding box nào. Nhấn &quot;B&quot; và kéo chuột trên ảnh để vẽ hộp mới.
          </div>
        ) : (
          boxes.map((box, idx) => {
            const isSelected = selectedBoxId === box.id;
            return (
              <div
                key={box.id}
                onClick={() => onSelectBox(box.id)}
                className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-300 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white capitalize">{box.label}</span>
                    {box.isAutoAnnotated && (
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1 rounded">
                        AI
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBox(box.id);
                    }}
                    className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-zinc-400 mt-2 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800/80">
                  <div>X: {Math.round(box.x)}</div>
                  <div>Y: {Math.round(box.y)}</div>
                  <div>W: {Math.round(box.width)}</div>
                  <div>H: {Math.round(box.height)}</div>
                </div>

                {box.confidence !== undefined && (
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1 font-mono">
                    <span>Độ tin cậy Model:</span>
                    <span className="text-emerald-400">{(box.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
