"use client";

import React from 'react';
import { TrendingUp, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { OverviewSummary } from '../types';

interface RoiMetricCardProps {
  summary?: OverviewSummary;
}

export const RoiMetricCard: React.FC<RoiMetricCardProps> = ({ summary }) => {
  const defaultSummary: OverviewSummary = {
    totalProjects: 4,
    totalAnnotatedFrames: 75740,
    activeTasks: 11,
    qualityRate: 84.2,
    unresolvedHardSlices: 24,
  };

  const data = summary || defaultSummary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1 */}
      <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-soft-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#5A6466]">
          <span className="text-xs font-semibold uppercase tracking-wider">Tổng Khung Hình Đã Gán</span>
          <div className="p-2 rounded-xl bg-[#E8F0EA] text-[#2D5A34]">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold font-editorial text-[#1F2627]">
            {data.totalAnnotatedFrames.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#2D5A34] font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Tiết kiệm 65% chi phí gán thủ công
          </div>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-soft-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#5A6466]">
          <span className="text-xs font-semibold uppercase tracking-wider">Độ Đồng Thuận QA/QC</span>
          <div className="p-2 rounded-xl bg-[#E6F0F7] text-[#2A5778]">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold font-editorial text-[#1F2627]">
            {data.qualityRate}%
          </div>
          <div className="text-[11px] text-[#2A5778] font-medium mt-1">
            Điểm số IoU đối soát 2 cấp độ
          </div>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-soft-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#5A6466]">
          <span className="text-xs font-semibold uppercase tracking-wider">Dự Án Đang Hoạt Động</span>
          <div className="p-2 rounded-xl bg-[#EFEBF5] text-[#55476E]">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold font-editorial text-[#1F2627]">
            {data.totalProjects} <span className="text-xs font-normal text-[#5A6466]">Chiến dịch</span>
          </div>
          <div className="text-[11px] text-[#55476E] font-medium mt-1">
            {data.activeTasks} tác vụ gán nhãn song song
          </div>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-white border border-[#E5E3DC] rounded-2xl p-5 shadow-soft-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#5A6466]">
          <span className="text-xs font-semibold uppercase tracking-wider">Ca Khó Cần Xử Lý</span>
          <div className="p-2 rounded-xl bg-[#FAF2E8] text-[#8C6239]">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold font-editorial text-[#1F2627]">
            {data.unresolvedHardSlices} <span className="text-xs font-normal text-[#5A6466]">Slices</span>
          </div>
          <div className="text-[11px] text-[#8C6239] font-medium mt-1">
            Ưu tiên giải quyết tại HITL Studio
          </div>
        </div>
      </div>
    </div>
  );
};
