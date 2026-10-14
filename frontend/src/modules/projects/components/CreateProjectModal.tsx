"use client";

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Plus } from 'lucide-react';
import { AnimatedContent } from '@/shared/components/ui';
import { CampaignType, CreateProjectPayload } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  initialName?: string;
}

const CAMPAIGN_OPTIONS: CampaignType[] = [
  'Active Learning V3',
  'Hard Slice Curation',
  'Edge INT8 Benchmark',
  'Zero-Shot Discovery',
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
  initialName = '',
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('Active Learning V3');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription('');
      setCampaignType('Active Learning V3');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    await onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
      campaign_type: campaignType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2627]/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg">
        <AnimatedContent distance={16} direction="vertical" reverse={false}>
          <div className="bg-[#FAF9F5] border border-[#E5E3DC] rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E3DC]">
              <div>
                <h3 className="text-xl font-bold text-[#1F2627] font-editorial">
                  Khởi tạo Dự án MLOps Mới
                </h3>
                <p className="text-xs text-[#475254] mt-0.5">
                  Thiết lập chiến dịch gán nhãn dữ liệu xe điện và cấu hình pipeline Active Learning.
                </p>
              </div>
              <button 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1 rounded-lg text-[#475254] hover:text-[#1F2627] hover:bg-black/5 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                aria-label="Đóng cửa sổ"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

        {/* Error Message */}
        {submitError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Tên dự án */}
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-semibold text-[#1F2627] flex items-center justify-between">
              <span>Tên dự án</span>
              <span className="text-rose-600 text-sm font-bold">*</span>
            </label>
            <input 
              type="text"
              placeholder="Ví dụ: Night Rain Object Detection V4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#D5D2C8] text-sm text-[#1F2627] placeholder:text-[#5A6466]/60 focus:outline-none focus:border-[#7FA086] focus:ring-4 focus:ring-[#7FA086]/20 transition-all"
            />
          </div>

          {/* Loại chiến dịch */}
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-semibold text-[#1F2627]">
              Loại chiến dịch dữ liệu
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CAMPAIGN_OPTIONS.map((cType) => (
                <button
                  key={cType}
                  type="button"
                  onClick={() => setCampaignType(cType)}
                  disabled={isSubmitting}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all ${
                    campaignType === cType
                      ? "bg-[#E8F0EA] border-[#7FA086] text-[#2D5A34] shadow-soft-sm"
                      : "bg-white border-[#D5D2C8] text-[#475254] hover:bg-black/5"
                  }`}
                >
                  {cType}
                </button>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5 text-left">
            <label className="text-sm font-semibold text-[#1F2627]">
              Mô tả mục tiêu chiến dịch (Tùy chọn)
            </label>
            <textarea 
              rows={3}
              placeholder="Mô tả phạm vi gán nhãn, điều kiện thời tiết, hoặc thiết bị nhúng triển khai..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 rounded-xl bg-white border border-[#D5D2C8] text-xs text-[#1F2627] placeholder:text-[#5A6466]/60 focus:outline-none focus:border-[#7FA086] focus:ring-4 focus:ring-[#7FA086]/20 transition-all resize-none"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5E3DC]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#475254] hover:text-[#1F2627] hover:bg-black/5 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F2627] hover:bg-[#121617] text-[#F8F7F2] text-xs font-semibold shadow-soft-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu vào Database...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Tạo mới & Khởi chạy</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AnimatedContent>
  </div>
</div>
  );
};
