"use client";

import React from 'react';
import { PieChart, Database } from 'lucide-react';
import { DatasetDistribution } from '../types';

interface DatasetBreakdownProps {
  distribution?: DatasetDistribution[];
}

export const DatasetBreakdown: React.FC<DatasetBreakdownProps> = ({ distribution }) => {
  const defaultDistribution: DatasetDistribution[] = [
    { category: 'Ô tô điện GreenSM & VF8', count: 32400, percentage: 42.8 },
    { category: 'Xe máy & Xe đạp điện đô thị', count: 21800, percentage: 28.8 },
    { category: 'Người đi bộ & Vạch qua đường', count: 11200, percentage: 14.8 },
    { category: 'Xe buýt điện GSM & Xe tải', count: 6800, percentage: 9.0 },
    { category: 'Biển báo & Tín hiệu giao thông', count: 3540, percentage: 4.6 },
  ];

  const data = distribution && distribution.length > 0 ? distribution : defaultDistribution;

  const colors = [
    'bg-[#2D5A34]',
    'bg-[#4B7A99]',
    'bg-[#7FA086]',
    'bg-[#8F8A99]',
    'bg-[#C6A97D]',
  ];

  return (
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 shadow-soft-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#ECEAE2] pb-4">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-[#2D5A34]" />
          <h3 className="text-base font-bold text-[#1F2627] font-editorial">
            Cơ Cấu Phân Phối Dữ Liệu Gán Nhãn (Dataset Distribution)
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#5A6466]">
          <Database className="h-3.5 w-3.5 text-[#2D5A34]" />
          <span>75,740 khung hình tổng</span>
        </div>
      </div>

      <div className="space-y-3.5 pt-1">
        {data.map((item, idx) => {
          const colorClass = colors[idx % colors.length];
          return (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#1F2627]">{item.category}</span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-[#5A6466]">{item.count.toLocaleString()} ảnh</span>
                  <span className="font-bold text-[#2D5A34]">{item.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#ECEAE2] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
