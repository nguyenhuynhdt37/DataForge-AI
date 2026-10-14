"use client";

import React from 'react';
import { Target, Zap, Loader2 } from 'lucide-react';

interface SamplingConfigCardProps {
  budget: number;
  onBudgetChange: (val: number) => void;
  onRunKCenter: () => void;
  isRunning: boolean;
  totalPoolSize: number;
}

export const SamplingConfigCard: React.FC<SamplingConfigCardProps> = ({
  budget,
  onBudgetChange,
  onRunKCenter,
  isRunning,
  totalPoolSize,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Target className="h-4 w-4 text-emerald-400" />
          <span>Ngân sách Gán nhãn (Active Sampling Budget)</span>
        </div>
        <span className="text-xs font-mono font-bold text-emerald-400">
          {budget} ảnh / đợt
        </span>
      </div>

      <div className="space-y-1.5">
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          disabled={isRunning}
          value={budget}
          onChange={(e) => onBudgetChange(parseInt(e.target.value, 10))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span>Pool: {totalPoolSize.toLocaleString()} frames</span>
          <span>Tỷ lệ chọn: {((budget / Math.max(totalPoolSize, 1)) * 100).toFixed(1)}%</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRunKCenter}
        disabled={isRunning}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang giải k-Center Coreset...</span>
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            <span>Kích hoạt Khai phá k-Center (Chạy thuật toán)</span>
          </>
        )}
      </button>
    </div>
  );
};
