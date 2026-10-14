"use client";

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { MiningWeights } from '../types';

interface WeightSliderPanelProps {
  weights: MiningWeights;
  onChange: (updated: MiningWeights) => void;
  disabled?: boolean;
}

export const WeightSliderPanel: React.FC<WeightSliderPanelProps> = ({
  weights,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
          <span>Trọng số Khai phá (Mining Weights)</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">Auto-Normalized</span>
      </div>

      {/* Uncertainty Margin */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-300">Độ bất định mô hình (Uncertainty Margin - w_u)</span>
          <span className="font-mono font-bold text-emerald-400">
            {weights.uncertaintyMargin.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          disabled={disabled}
          value={weights.uncertaintyMargin}
          onChange={(e) =>
            onChange({ ...weights, uncertaintyMargin: parseFloat(e.target.value) })
          }
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
        />
        <p className="text-[10px] text-zinc-500">Ưu tiên ảnh mô hình nhận diện với xác suất gần ngưỡng phân vân (0.45 - 0.55)</p>
      </div>

      {/* Hard Slice Weight */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-300">Trọng số Ca khó thời tiết/đèn pha (Hard Slice - w_s)</span>
          <span className="font-mono font-bold text-amber-400">
            {weights.sliceWeight.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          disabled={disabled}
          value={weights.sliceWeight}
          onChange={(e) =>
            onChange({ ...weights, sliceWeight: parseFloat(e.target.value) })
          }
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
        />
        <p className="text-[10px] text-zinc-500">Tăng trọng số cho lát cắt mưa lớn, đêm tối, chói sáng đèn pha đối diện</p>
      </div>

      {/* Diversity (K-Center Distance) */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-300">Độ đa dạng hình học (Diversity Coreset - w_d)</span>
          <span className="font-mono font-bold text-blue-400">
            {weights.diversity.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.05"
          disabled={disabled}
          value={weights.diversity}
          onChange={(e) =>
            onChange({ ...weights, diversity: parseFloat(e.target.value) })
          }
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
        />
        <p className="text-[10px] text-zinc-500">Ngăn ngừa chọn các ảnh gần nhau, đảm bảo phủ đều không gian embedding</p>
      </div>
    </div>
  );
};
