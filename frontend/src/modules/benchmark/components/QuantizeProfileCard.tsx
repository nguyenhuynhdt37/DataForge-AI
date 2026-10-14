"use client";

import React from 'react';
import { Cpu, Zap, Activity, HardDrive, CheckCircle2 } from 'lucide-react';
import { BenchmarkProfile } from '../types';

interface QuantizeProfileCardProps {
  profile: BenchmarkProfile;
  isSelected?: boolean;
  onSelect?: (profile: BenchmarkProfile) => void;
  onRunTest?: (profile: BenchmarkProfile) => void;
  isRunning?: boolean;
}

export const QuantizeProfileCard: React.FC<QuantizeProfileCardProps> = ({
  profile,
  isSelected = false,
  onSelect,
  onRunTest,
  isRunning = false,
}) => {
  const getBadgeStyle = (quant: string) => {
    switch (quant) {
      case 'INT8':
        return 'bg-[#E8F0EA] text-[#2D5A34] border-[#CDE0D1]';
      case 'FP16':
        return 'bg-[#E6F0F7] text-[#2A5778] border-[#C6D9E8]';
      case 'FP32':
        return 'bg-[#EFEBF5] text-[#55476E] border-[#DFD8EB]';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div
      onClick={() => onSelect?.(profile)}
      className={`relative bg-white border rounded-2xl p-6 transition-all cursor-pointer shadow-soft-sm hover:shadow-soft-md flex flex-col justify-between ${
        isSelected
          ? 'border-[#7FA086] ring-2 ring-[#7FA086]/20 bg-[#FAF9F5]'
          : 'border-[#E5E3DC] hover:border-[#B7CDBB]'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle(profile.quantization)}`}>
                {profile.quantization}
              </span>
              <span className="text-xs font-mono text-[#5A6466]">
                {profile.device}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#1F2627] font-editorial mt-2">
              {profile.modelName}
            </h3>
          </div>

          {isSelected && (
            <div className="p-1 rounded-full bg-[#E8F0EA] text-[#2D5A34]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#ECEAE2]">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#5A6466]">
              <Zap className="h-3.5 w-3.5 text-[#D97706]" />
              <span>Độ trễ suy luận</span>
            </div>
            <div className="text-2xl font-extrabold text-[#1F2627] font-editorial mt-0.5">
              {profile.latencyMs.toFixed(1)} <span className="text-xs font-normal text-[#5A6466]">ms</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#5A6466]">
              <Activity className="h-3.5 w-3.5 text-[#2D5A34]" />
              <span>Tốc độ khung hình</span>
            </div>
            <div className="text-2xl font-extrabold text-[#1F2627] font-editorial mt-0.5">
              {profile.fps} <span className="text-xs font-normal text-[#5A6466]">FPS</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#5A6466]">
              <Cpu className="h-3.5 w-3.5 text-[#2A5778]" />
              <span>Độ chính xác mAP@50</span>
            </div>
            <div className="text-lg font-bold text-[#1F2627] font-mono mt-0.5">
              {(profile.mAP50 * 100).toFixed(1)}%
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#5A6466]">
              <HardDrive className="h-3.5 w-3.5 text-[#55476E]" />
              <span>Bộ nhớ RAM</span>
            </div>
            <div className="text-lg font-bold text-[#1F2627] font-mono mt-0.5">
              {profile.memoryMb} <span className="text-xs font-normal text-[#5A6466]">MB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between text-xs">
        <span className="text-[#5A6466] font-mono text-[11px]">
          Kiểm thử: {profile.testedAt}
        </span>
        <button
          type="button"
          disabled={isRunning}
          onClick={(e) => {
            e.stopPropagation();
            onRunTest?.(profile);
          }}
          className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] font-semibold transition-all disabled:opacity-50"
        >
          {isRunning ? 'Đang chạy...' : 'Đo trễ lại'}
        </button>
      </div>
    </div>
  );
};
