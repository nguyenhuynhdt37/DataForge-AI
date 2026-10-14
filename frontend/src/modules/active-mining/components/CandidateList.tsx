"use client";

import React from 'react';
import { ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { MiningPoint } from '../types';

interface CandidateListProps {
  points: MiningPoint[];
  selectedIds: string[];
  onSelectCandidate?: (pt: MiningPoint) => void;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  points,
  selectedIds,
  onSelectCandidate,
}) => {
  const selectedSet = new Set(selectedIds.map(String));
  const candidateList = points.filter((p) => selectedSet.has(String(p.id)));

  if (candidateList.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl">
        <p className="text-xs text-zinc-400">
          Chưa có mẫu nào được chọn. Nhấn &quot;Kích hoạt Khai phá k-Center&quot; để thuật toán tự động chọn lọc các ca khó tối ưu nhất.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Danh sách Mẫu được Khai phá ({candidateList.length})</span>
        </div>
        <span className="text-xs font-mono text-zinc-500">Ưu tiên đưa vào HITL Studio</span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {candidateList.map((cand) => (
          <div
            key={cand.id}
            onClick={() => onSelectCandidate?.(cand)}
            className="p-3 bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400">
                #{cand.id}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-200">
                  PCA Coord: ({cand.x.toFixed(1)}, {cand.y.toFixed(1)})
                </span>
                {cand.isHardSlice && (
                  <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Ca khó đặc biệt
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </div>
        ))}
      </div>
    </div>
  );
};
