"use client";

import React from 'react';
import { Activity, CheckCircle2, Clock, XCircle, ArrowUpRight } from 'lucide-react';
import { RecentRun } from '../types';

interface RecentRunsTableProps {
  runs?: RecentRun[];
}

export const RecentRunsTable: React.FC<RecentRunsTableProps> = ({ runs }) => {
  const defaultRuns: RecentRun[] = [
    {
      id: 'RUN-VF8-091',
      name: 'Active Mining Batch #42 (Mưa Đêm)',
      type: 'k-Center Greedy',
      status: 'completed',
      duration: '4m 12s',
      completedAt: '12 phút trước',
    },
    {
      id: 'RUN-VF8-090',
      name: 'Dedup Cosine Clustering Slice S2',
      type: 'CLIP Embedding',
      status: 'completed',
      duration: '1m 45s',
      completedAt: '45 phút trước',
    },
    {
      id: 'RUN-VF8-089',
      name: 'YOLO11n OpenVINO INT8 Latency Profiling',
      type: 'Edge Benchmark',
      status: 'completed',
      duration: '2m 30s',
      completedAt: '2 giờ trước',
    },
    {
      id: 'RUN-VF8-088',
      name: 'Auto-Annotation VF8 Telematics Stream',
      type: 'Grounding DINO',
      status: 'running',
      duration: 'Đang chạy...',
      completedAt: 'Hiện tại',
    },
  ];

  const data = runs && runs.length > 0 ? runs : defaultRuns;

  const getStatusBadge = (status: RecentRun['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] text-[11px] font-mono font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Thành công
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F0F7] text-[#2A5778] border border-[#C6D9E8] text-[11px] font-mono font-semibold">
            <Clock className="h-3 w-3 animate-spin" /> Đang xử lý
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBEAE8] text-[#8C2E24] border border-[#F4CCC8] text-[11px] font-mono font-semibold">
            <XCircle className="h-3 w-3" /> Thất bại
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 shadow-soft-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#2D5A34]" />
          <h3 className="text-base font-bold text-[#1F2627] font-editorial">
            Lịch Sử Lượt Chạy MLOps Gần Đây (Recent Pipeline Runs)
          </h3>
        </div>
        <span className="text-xs font-mono text-[#5A6466]">
          Real-time Event Stream
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#ECEAE2] text-[#5A6466] font-mono font-semibold uppercase text-[11px]">
              <th className="py-3 px-3">Mã Lượt Chạy</th>
              <th className="py-3 px-3">Tác Vụ & Chiến Dịch</th>
              <th className="py-3 px-3">Thuật Toán / Loại</th>
              <th className="py-3 px-3">Thời Lượng</th>
              <th className="py-3 px-3">Thời Điểm</th>
              <th className="py-3 px-3 text-right">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECEAE2]">
            {data.map((run) => (
              <tr key={run.id} className="hover:bg-[#FAF9F5] transition-colors">
                <td className="py-3.5 px-3 font-mono font-bold text-[#2D5A34]">
                  {run.id}
                </td>
                <td className="py-3.5 px-3 font-medium text-[#1F2627]">
                  {run.name}
                </td>
                <td className="py-3.5 px-3 font-mono text-[#5A6466]">
                  {run.type}
                </td>
                <td className="py-3.5 px-3 font-mono text-[#1F2627]">
                  {run.duration}
                </td>
                <td className="py-3.5 px-3 text-[#5A6466]">
                  {run.completedAt}
                </td>
                <td className="py-3.5 px-3 text-right">
                  {getStatusBadge(run.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
