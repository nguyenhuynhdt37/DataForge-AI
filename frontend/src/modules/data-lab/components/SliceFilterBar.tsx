"use client";

import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { SliceQueryFilters } from '../types';

interface SliceFilterBarProps {
  filters: SliceQueryFilters;
  onFilterChange: (updated: Partial<SliceQueryFilters>) => void;
  onReset: () => void;
  totalResults: number;
}

export const SliceFilterBar: React.FC<SliceFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalResults,
}) => {
  return (
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-4 shadow-soft-sm space-y-3">
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6466]" />
          <input
            type="text"
            placeholder="Tìm kiếm lát cắt, tags, điều kiện camera..."
            value={filters.keyword || ''}
            onChange={(e) => onFilterChange({ keyword: e.target.value })}
            className="w-full bg-[#FAF9F5] border border-[#ECEAE2] rounded-xl pl-10 pr-4 py-2 text-xs text-[#1F2627] placeholder:text-[#5A6466]/60 focus:outline-none focus:border-[#7FA086] focus:bg-white"
          />
        </div>

        {/* Thời tiết */}
        <div className="w-full md:w-44">
          <select
            value={filters.weather || ''}
            onChange={(e) => onFilterChange({ weather: e.target.value || undefined })}
            className="w-full bg-[#FAF9F5] border border-[#ECEAE2] rounded-xl px-3 py-2 text-xs text-[#1F2627] focus:outline-none focus:border-[#7FA086]"
          >
            <option value="">Tất cả thời tiết</option>
            <option value="rain">Mưa rào / Trơn trượt</option>
            <option value="fog">Sương mù dày đặc</option>
            <option value="clear">Trời trong sáng</option>
            <option value="overcast">Âm u mây mù</option>
          </select>
        </div>

        {/* Ánh sáng */}
        <div className="w-full md:w-44">
          <select
            value={filters.lighting || ''}
            onChange={(e) => onFilterChange({ lighting: e.target.value || undefined })}
            className="w-full bg-[#FAF9F5] border border-[#ECEAE2] rounded-xl px-3 py-2 text-xs text-[#1F2627] focus:outline-none focus:border-[#7FA086]"
          >
            <option value="">Tất cả ánh sáng</option>
            <option value="night">Ban đêm đô thị</option>
            <option value="glare">Chói sáng đèn pha/mặt trời</option>
            <option value="dusk">Hoàng hôn / Chạng vạng</option>
            <option value="day">Ban ngày tiêu chuẩn</option>
          </select>
        </div>

        {/* Reset */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#5A6466] hover:text-[#1F2627] hover:bg-black/5 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Đặt lại
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#5A6466] pt-2 border-t border-[#ECEAE2]">
        <span>Hiển thị kết quả: <strong className="text-[#1F2627]">{totalResults}</strong> lát cắt</span>
        <span>Lọc đa tiêu chí tích hợp Data Lake GreenSM Fleet</span>
      </div>
    </div>
  );
};
