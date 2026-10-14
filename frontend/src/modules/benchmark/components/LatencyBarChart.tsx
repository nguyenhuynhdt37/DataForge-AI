"use client";

import React from 'react';
import { Gauge, ArrowDownRight, Zap } from 'lucide-react';
import { BenchmarkProfile } from '../types';

interface LatencyBarChartProps {
  profiles: BenchmarkProfile[];
  selectedProfileId?: string;
  onSelectProfile?: (id: string) => void;
}

export const LatencyBarChart: React.FC<LatencyBarChartProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
}) => {
  // Lấy giá trị latency lớn nhất để tính % chiều dài thanh bar
  const maxLatency = Math.max(...profiles.map((p) => p.latencyMs), 25);

  // Tìm profile FP32 làm baseline để so sánh tốc độ
  const fp32Profile = profiles.find((p) => p.quantization === 'FP32');
  const baselineLatency = fp32Profile?.latencyMs || 18.4;

  return (
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 shadow-soft-sm space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#ECEAE2] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#2D5A34]" />
            <h3 className="text-base font-bold text-[#1F2627] font-editorial">
              So Sánh Độ Trễ Suy Luận (Latency Benchmark)
            </h3>
          </div>
          <p className="text-xs text-[#5A6466] mt-0.5">
            Đo lường thời gian xử lý 1 khung hình camera (Batch size = 1) trên CPU nhúng Intel x86.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0EA] border border-[#CDE0D1] text-[11px] font-mono text-[#2D5A34] font-semibold">
          <Zap className="h-3 w-3" />
          <span>Mục tiêu Edge SLA: &le; 10ms</span>
        </div>
      </div>

      <div className="space-y-4">
        {profiles.map((profile) => {
          const isSelected = profile.id === selectedProfileId;
          const barWidthPercent = Math.min(100, Math.max(8, (profile.latencyMs / maxLatency) * 100));
          const speedupRatio = (baselineLatency / profile.latencyMs).toFixed(2);

          let barColor = 'bg-[#7FA086]';
          if (profile.quantization === 'INT8') {
            barColor = 'bg-[#2D5A34]';
          } else if (profile.quantization === 'FP16') {
            barColor = 'bg-[#4B7A99]';
          } else {
            barColor = 'bg-[#8F8A99]';
          }

          return (
            <div
              key={profile.id}
              onClick={() => onSelectProfile?.(profile.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#7FA086] bg-[#FAF9F5]'
                  : 'border-transparent hover:border-[#ECEAE2] hover:bg-[#F8F7F2]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2 font-semibold text-[#1F2627]">
                  <span className="font-mono">{profile.quantization}</span>
                  <span className="text-[#5A6466] font-normal">({profile.modelName})</span>
                  {profile.quantization === 'INT8' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] font-mono font-bold">
                      OpenVINO INT8
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-[#1F2627]">
                    {profile.latencyMs.toFixed(1)} ms
                  </span>
                  {profile.quantization !== 'FP32' && (
                    <span className="inline-flex items-center text-[11px] font-mono text-[#2D5A34] font-semibold">
                      <ArrowDownRight className="h-3 w-3" />
                      {speedupRatio}x nhanh hơn
                    </span>
                  )}
                </div>
              </div>

              {/* Bar track */}
              <div className="w-full h-3 bg-[#ECEAE2] rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#5A6466] mt-1.5">
                <span>{profile.fps} FPS</span>
                <span>mAP@50: {(profile.mAP50 * 100).toFixed(1)}%</span>
                <span>RAM: {profile.memoryMb} MB</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
