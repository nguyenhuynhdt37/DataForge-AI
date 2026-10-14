"use client";

import React from 'react';
import { Layers, AlertTriangle, ShieldCheck, Database } from 'lucide-react';
import { DataSlice } from '../types';
import { MetadataTagBadge } from './MetadataTagBadge';

interface SliceMetricCardProps {
  slice: DataSlice;
  onSelect?: (slice: DataSlice) => void;
  onTriggerDedup?: (slice: DataSlice) => void;
}

export const SliceMetricCard: React.FC<SliceMetricCardProps> = ({
  slice,
  onSelect,
  onTriggerDedup,
}) => {
  const hardRatio = slice.total_samples > 0 
    ? Math.round((slice.hard_samples_count / slice.total_samples) * 100) 
    : 0;

  return (
    <div className="bg-white border border-[#E5E3DC] hover:border-[#B7CDBB] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-mono font-bold text-[#2D5A34] px-2 py-0.5 rounded-md bg-[#E8F0EA] border border-[#CDE0D1]">
            {slice.id}
          </span>
          <span className="text-[11px] font-mono text-[#5A6466]">
            {slice.status === 'active' ? 'Sẵn sàng train' : slice.status}
          </span>
        </div>

        <h3 className="text-base font-bold text-[#1F2627] font-editorial group-hover:text-[#2D5A34] transition-colors">
          {slice.name}
        </h3>
        
        {slice.description && (
          <p className="text-xs text-[#5A6466] mt-1 line-clamp-2">
            {slice.description}
          </p>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 my-4 p-3 rounded-xl bg-[#FAF9F5] border border-[#ECEAE2]">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[#7FA086] shrink-0" />
            <div>
              <div className="text-[10px] text-[#5A6466]">Tổng frames</div>
              <div className="text-xs font-mono font-bold text-[#1F2627]">
                {slice.total_samples.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] text-[#5A6466]">Ca khó (Hard)</div>
              <div className="text-xs font-mono font-bold text-amber-600">
                {slice.hard_samples_count.toLocaleString()} ({hardRatio}%)
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {slice.tags.map((tag) => (
            <MetadataTagBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[#ECEAE2]">
        <button
          type="button"
          onClick={() => onTriggerDedup?.(slice)}
          className="flex-1 px-3 py-1.5 text-xs font-semibold text-[#2D5A34] bg-[#E8F0EA] hover:bg-[#d8e7dc] rounded-xl border border-[#CDE0D1] transition-colors cursor-pointer"
        >
          Lọc Trùng Dedup
        </button>
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(slice)}
            className="px-3 py-1.5 text-xs font-semibold text-[#1F2627] hover:bg-black/5 rounded-xl border border-[#D5D2C8] transition-colors cursor-pointer"
          >
            Chi tiết
          </button>
        )}
      </div>
    </div>
  );
};
