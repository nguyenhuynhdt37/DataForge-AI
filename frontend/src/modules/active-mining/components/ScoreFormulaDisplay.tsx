import React from 'react';
import { MiningWeights } from '../types';

interface ScoreFormulaDisplayProps {
  weights: MiningWeights;
}

export const ScoreFormulaDisplay: React.FC<ScoreFormulaDisplayProps> = ({ weights }) => {
  return (
    <div className="p-4 bg-zinc-950/90 border border-zinc-800 rounded-2xl font-mono text-xs text-zinc-300 space-y-2">
      <div className="text-[11px] text-zinc-500 font-sans font-semibold uppercase tracking-wider">
        Hàm Mục Tiêu Tối Ưu Hóa (Objective Formulation)
      </div>
      <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 text-emerald-400 font-bold overflow-x-auto">
        Score(x) = {weights.uncertaintyMargin.toFixed(2)} &times; U(x) + {weights.sliceWeight.toFixed(2)} &times; S(x) + {weights.diversity.toFixed(2)} &times; min||&phi;(x) - &phi;(c_j)||
      </div>
      <div className="text-[10px] text-zinc-400 font-sans">
        Thuật toán <strong>k-Center Greedy Coreset</strong> sẽ giải quyết bài toán min-max radius để phủ đầy đủ không gian ca khó với số lượng nhãn gán tối thiểu.
      </div>
    </div>
  );
};
