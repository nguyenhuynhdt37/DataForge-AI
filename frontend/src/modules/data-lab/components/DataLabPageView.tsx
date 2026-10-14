"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Database, 
  Layers, 
  Download, 
  Sparkles, 
  ChevronLeft, 
  CheckCircle2, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Squares, SplitText } from '@/shared/components/react-bits';
import { DataSlice } from '../types';
import { useSliceQuery } from '../hooks/useSliceQuery';
import { SliceMetricCard } from './SliceMetricCard';
import { SliceFilterBar } from './SliceFilterBar';
import { DedupSummaryModal } from './DedupSummaryModal';
import { ImageGridPreview, SampleFrame } from './ImageGridPreview';
import { dataLabApi } from '../services/dataLabApi';
import { AppHeader } from '@/shared/components/layout';

const SAMPLE_FRAMES: SampleFrame[] = [
  {
    id: 'FRM-0941',
    camera: 'Fisheye 360',
    timestamp: '14:28:10',
    uncertaintyScore: 0.88,
    condition: 'Mưa to cần gạt nước chớp giật',
    boxesCount: 9,
    isHardSlice: true,
  },
  {
    id: 'FRM-0942',
    camera: 'Telephoto Front',
    timestamp: '14:28:11',
    uncertaintyScore: 0.94,
    condition: 'Xe máy luồn lách điểm mù kính chiếu hậu',
    boxesCount: 14,
    isHardSlice: true,
  },
  {
    id: 'FRM-0943',
    camera: 'Telephoto Rear',
    timestamp: '14:28:12',
    uncertaintyScore: 0.42,
    condition: 'Đường thông thoáng ban ngày',
    boxesCount: 3,
    isHardSlice: false,
  },
  {
    id: 'FRM-0944',
    camera: 'Wide Cabin',
    timestamp: '14:28:13',
    uncertaintyScore: 0.79,
    condition: 'Chói nắng ngược sáng trên cầu Nhật Tân',
    boxesCount: 7,
    isHardSlice: true,
  },
];

export const DataLabPageView: React.FC = () => {
  const { slices, filters, updateFilters, resetFilters } = useSliceQuery();
  const [selectedSliceForDedup, setSelectedSliceForDedup] = useState<DataSlice | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExportData = async (format: 'coco' | 'yolo') => {
    if (slices.length === 0) return;
    setIsExporting(true);
    try {
      const targetSlice = slices[0];
      const res = await dataLabApi.exportSlice({
        slice_id: targetSlice.id,
        format,
        include_hard_slices_only: true,
      });
      setToastMessage(`Đã xuất tập dữ liệu ${format.toUpperCase()} thành công: ${res.data.total_exported} mẫu!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setToastMessage(`Đã tạo lệnh xuất tập dữ liệu format ${format.toUpperCase()} (Offline mode).`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1F2627] flex flex-col relative overflow-hidden font-sans selection:bg-[#DCEBE0]">
      {/* Background Subtle Squares */}
      <Squares 
        direction="diagonal" 
        speed={0.15} 
        squareSize={56} 
        borderColor="#ECEAE2" 
        hoverFillColor="#E2EFE5" 
      />

      {/* 3-Zone Soft Editorial Tech AppHeader */}
      <AppHeader
        customActions={
          <button
            type="button"
            onClick={() => handleExportData('yolo')}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-[#1F2627] hover:bg-[#121617] text-[#F8F7F2] px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-soft-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất YOLOv8</span>
          </button>
        }
      />

      {/* Main Content */}
      <main className="relative flex-1 max-w-[1340px] mx-auto w-full px-6 py-10 z-10 space-y-8">
        
        {/* Toast */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-[#E8F0EA] border border-[#CDE0D1] flex items-center justify-between text-xs text-[#2D5A34] font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button 
              type="button"
              onClick={() => setToastMessage(null)} 
              className="text-[#2D5A34] hover:opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#E5E3DC]">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#2D5A34]">
              DATA ENGINE & HARD SLICE CURATION
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1F2627] font-editorial mt-1">
              <SplitText text="Data Lab — Phân Tầng Lát Cắt Dữ Liệu" delay={20} />
            </h1>
            <p className="text-xs text-[#475254] mt-1">
              Phân tích telemetry camera xe điện GreenSM, lọc trùng lặp hành trình và tinh chọn lát cắt khó.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportData('coco')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#2D5A34] bg-[#E8F0EA] border border-[#CDE0D1] rounded-xl hover:bg-[#d8e7dc] transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Xuất COCO JSON
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <SliceFilterBar
          filters={filters}
          onFilterChange={updateFilters}
          onReset={resetFilters}
          totalResults={slices.length}
        />

        {/* Slices Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1F2627] font-editorial flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#2D5A34]" />
              Danh mục các Lát cắt (Data Slices)
            </h2>
            <span className="text-xs font-mono text-[#5A6466]">
              {slices.length} lát cắt đang quản trị
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {slices.map((slice) => (
              <SliceMetricCard
                key={slice.id}
                slice={slice}
                onTriggerDedup={(s) => setSelectedSliceForDedup(s)}
              />
            ))}
          </div>
        </div>

        {/* Visual Inspection Section */}
        <div className="space-y-4 pt-6 border-t border-[#E5E3DC]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1F2627] font-editorial flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#7FA086]" />
                Giám định Thị giác Khung hình Thực địa (Sensor Feeds)
              </h2>
              <p className="text-xs text-[#5A6466] mt-0.5">
                Các khung hình có độ bất định cao (Uncertainty &gt; 0.70) được trích xuất tự động từ camera 360 & telephoto.
              </p>
            </div>
            <Link
              href="/hitl-studio"
              className="text-xs font-semibold text-[#2D5A34] hover:underline"
            >
              Gán nhãn chi tiết trong HITL Studio &rarr;
            </Link>
          </div>

          <ImageGridPreview samples={SAMPLE_FRAMES} />
        </div>
      </main>

      {/* Dedup Modal */}
      <DedupSummaryModal
        isOpen={Boolean(selectedSliceForDedup)}
        onClose={() => setSelectedSliceForDedup(null)}
        slice={selectedSliceForDedup}
        onCompleted={(res) => {
          setToastMessage(`Đã loại bỏ ${res.removed_duplicates} ảnh trùng lặp! Giữ lại ${res.retained_samples} ảnh chất lượng.`);
        }}
      />
    </div>
  );
};
