"use client";

import React, { useState } from 'react';
import { X, Cpu, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { DataSlice, DedupAlgorithm, DedupJobResponse } from '../types';
import { dataLabApi } from '../services/dataLabApi';

interface DedupSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  slice: DataSlice | null;
  onCompleted?: (result: DedupJobResponse) => void;
}

export const DedupSummaryModal: React.FC<DedupSummaryModalProps> = ({
  isOpen,
  onClose,
  slice,
  onCompleted,
}) => {
  const [threshold, setThreshold] = useState<number>(0.85);
  const [algorithm, setAlgorithm] = useState<DedupAlgorithm>('clip_embedding');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<DedupJobResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !slice) return null;

  const handleRunDedup = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await dataLabApi.triggerDedup({
        slice_id: slice.id,
        similarity_threshold: threshold,
        algorithm,
      });
      setResult(res.data);
      onCompleted?.(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi kích hoạt AI Dedup';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E3DC] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E3DC] bg-[#FAF9F5]">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[#2D5A34]" />
            <h3 className="text-base font-bold text-[#1F2627] font-editorial">
              Tối ưu & Lọc Trùng Lặp (AI Dedup)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#5A6466] hover:text-[#1F2627] hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-3.5 bg-[#FAF9F5] rounded-xl border border-[#ECEAE2]">
            <div className="text-xs text-[#5A6466]">Đang áp dụng cho tập lát cắt:</div>
            <div className="text-sm font-bold text-[#1F2627] font-editorial mt-0.5">
              {slice.name} <span className="text-xs font-mono font-normal text-[#2D5A34]">({slice.id})</span>
            </div>
            <div className="text-xs text-[#5A6466] mt-1 font-mono">
              Tổng số khung hình hiện tại: {slice.total_samples.toLocaleString()} ảnh
            </div>
          </div>

          {/* Thuật toán */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1F2627]">Thuật toán Nhúng Không Gian (Embedding)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAlgorithm('clip_embedding')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  algorithm === 'clip_embedding'
                    ? 'border-[#2D5A34] bg-[#E8F0EA]/50 ring-2 ring-[#2D5A34]/20'
                    : 'border-[#ECEAE2] hover:bg-zinc-50'
                }`}
              >
                <div className="text-xs font-bold text-[#1F2627]">CLIP Embedding Cosine</div>
                <div className="text-[10px] text-[#5A6466] mt-0.5">Độ chính xác cao, hiểu ngữ nghĩa đa góc quay</div>
              </button>

              <button
                type="button"
                onClick={() => setAlgorithm('phash')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  algorithm === 'phash'
                    ? 'border-[#2D5A34] bg-[#E8F0EA]/50 ring-2 ring-[#2D5A34]/20'
                    : 'border-[#ECEAE2] hover:bg-zinc-50'
                }`}
              >
                <div className="text-xs font-bold text-[#1F2627]">Perceptual Hash (pHash)</div>
                <div className="text-[10px] text-[#5A6466] mt-0.5">Siêu nhanh, lọc khung hình xe đỗ đèn đỏ</div>
              </button>
            </div>
          </div>

          {/* Ngưỡng Tương Đồng */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#1F2627]">Ngưỡng tương đồng (Threshold):</span>
              <span className="font-mono font-bold text-[#2D5A34]">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#E5E3DC] rounded-lg appearance-none cursor-pointer accent-[#2D5A34]"
            />
            <div className="flex justify-between text-[10px] text-[#5A6466]">
              <span>0.50 (Lọc mạnh, giữ mẫu đa dạng)</span>
              <span>0.99 (Chỉ lọc khung hình gần như giống hệt)</span>
            </div>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Kết quả thành công */}
          {result && (
            <div className="p-4 bg-[#E8F0EA] border border-[#CDE0D1] rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2D5A34]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Đã tối ưu xong lát cắt dữ liệu!</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2 bg-white rounded-lg border border-[#CDE0D1]">
                  <div className="text-[10px] text-[#5A6466]">Ảnh loại bỏ</div>
                  <div className="text-xs font-mono font-bold text-red-600">
                    -{result.removed_duplicates.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#CDE0D1]">
                  <div className="text-[10px] text-[#5A6466]">Ảnh giữ lại</div>
                  <div className="text-xs font-mono font-bold text-[#2D5A34]">
                    {result.retained_samples.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#CDE0D1]">
                  <div className="text-[10px] text-[#5A6466]">Thời gian chạy</div>
                  <div className="text-xs font-mono font-bold text-[#1F2627]">
                    {result.execution_time_ms} ms
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E3DC] bg-[#FAF9F5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5A6466] hover:text-[#1F2627] cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleRunDedup}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#1F2627] hover:bg-[#121617] rounded-xl cursor-pointer disabled:opacity-50"
          >
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isProcessing ? 'Đang phân tích...' : 'Kích hoạt Dedup Engine'}
          </button>
        </div>
      </div>
    </div>
  );
};
