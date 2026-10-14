"use client";

import React, { useState } from 'react';
import { MiningPoint } from '../types';

interface PcaScatterPlotProps {
  points: MiningPoint[];
  selectedIds: string[];
  onSelectPoint?: (point: MiningPoint) => void;
}

export const PcaScatterPlot: React.FC<PcaScatterPlotProps> = ({
  points,
  selectedIds,
  onSelectPoint,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<MiningPoint | null>(null);

  const selectedSet = new Set(selectedIds.map(String));

  return (
    <div className="relative w-full h-[480px] bg-zinc-950/80 rounded-2xl border border-zinc-800 p-4 overflow-hidden flex flex-col justify-between">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />

      {/* Axis markers */}
      <div className="absolute left-3 top-3 text-[10px] font-mono text-zinc-500">
        Embedding Axis PCA-2 (Uncertainty Gradient)
      </div>
      <div className="absolute right-3 bottom-3 text-[10px] font-mono text-zinc-500">
        PCA-1 (Feature Manifold)
      </div>

      {/* Points Canvas */}
      <div className="relative w-full h-full">
        {points.map((pt) => {
          const isSelected = selectedSet.has(String(pt.id));
          const isHard = pt.isHardSlice;

          let colorClass = 'bg-zinc-600 hover:bg-zinc-400';
          if (isSelected) {
            colorClass = 'bg-emerald-400 ring-4 ring-emerald-500/30 scale-125 z-20';
          } else if (isHard) {
            colorClass = 'bg-amber-500 ring-2 ring-amber-500/20';
          }

          return (
            <div
              key={pt.id}
              onClick={() => onSelectPoint?.(pt)}
              onMouseEnter={() => setHoveredPoint(pt)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{
                left: `${Math.min(Math.max(pt.x, 3), 97)}%`,
                top: `${Math.min(Math.max(pt.y, 3), 97)}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer transition-transform duration-200 ${colorClass}`}
            />
          );
        })}
      </div>

      {/* Hover Info Tooltip */}
      {hoveredPoint && (
        <div className="absolute bottom-4 left-4 z-30 p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 font-mono shadow-xl animate-in fade-in">
          <div className="font-bold text-white flex items-center gap-1.5">
            Mẫu ID: #{hoveredPoint.id}
            {hoveredPoint.isHardSlice && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px]">Hard Slice</span>
            )}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            X (PCA-1): {hoveredPoint.x.toFixed(2)} | Y (PCA-2): {hoveredPoint.y.toFixed(2)}
          </div>
          {hoveredPoint.confidence !== undefined && (
            <div className="text-[11px] text-zinc-400">
              Confidence: {(hoveredPoint.confidence * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="relative z-10 flex items-center gap-4 text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
          <span>Mẫu thông thường</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Ca khó (Hard Slice)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>K-Center Coreset Chọn</span>
        </div>
      </div>
    </div>
  );
};
