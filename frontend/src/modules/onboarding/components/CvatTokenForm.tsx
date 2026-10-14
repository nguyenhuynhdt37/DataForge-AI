"use client";

import React, { useState } from 'react';
import { Loader2, KeyRound, ExternalLink, ArrowRight, ShieldCheck } from 'lucide-react';

interface CvatTokenFormProps {
  onSubmit: (patToken: string) => Promise<boolean>;
  onDismiss: () => void;
  loading: boolean;
  isDark?: boolean;
}

export const CvatTokenForm: React.FC<CvatTokenFormProps> = ({
  onSubmit,
  onDismiss,
  loading,
}) => {
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    await onSubmit(token);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-xs font-semibold text-[#1F2627] tracking-tight flex items-center justify-between">
          <span>Personal Access Token (PAT)</span>
          <span className="text-rose-600 font-bold">*</span>
        </label>
        <div className="relative">
          <textarea
            rows={3}
            placeholder="Dán chuỗi Token cá nhân sinh từ CVAT Host..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-3 text-xs font-mono rounded-xl border border-[#D5D2C8] bg-white text-[#1F2627] placeholder:text-[#5A6466]/70 outline-none transition-all duration-150 resize-none focus:border-[#7FA086] focus:ring-4 focus:ring-[#7FA086]/25 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
            required
          />
        </div>
      </div>

      {/* Hướng dẫn tạo PAT token */}
      <div className="p-3.5 rounded-2xl bg-[#F4F2EC] border border-[#ECEAE2] text-xs text-[#5A6466] space-y-1.5 leading-relaxed">
        <div className="font-semibold text-[#1F2627] flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
          <KeyRound className="w-3.5 h-3.5 text-[#2D5A34]" />
          <span>Quy trình cấp mã Token:</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Đăng nhập vào{' '}
          <a
            href="https://cvat.itup.io.vn"
            target="_blank"
            rel="noreferrer"
            className="text-[#2D5A34] underline font-semibold inline-flex items-center gap-0.5"
          >
            cvat.itup.io.vn <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>{' '}
          &rarr; Profile Settings &rarr; Personal Access Tokens &rarr; Create New Token.
        </p>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#5A6466] pt-0.5">
        <ShieldCheck className="w-4 h-4 text-[#2D5A34] shrink-0" />
        <span>Token được mã hóa an toàn và chỉ dùng để truy xuất tác vụ gán nhãn.</span>
      </div>

      {/* Nút Submit & Dismiss */}
      <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#ECEAE2]">
        <button
          type="button"
          onClick={onDismiss}
          disabled={loading}
          className="px-4 py-2.5 text-xs font-semibold text-[#5A6466] hover:text-[#1F2627] rounded-xl hover:bg-[#F2EFE9] transition cursor-pointer"
        >
          Thiết lập sau
        </button>

        <button
          type="submit"
          disabled={loading || !token.trim()}
          className="
            px-6 py-2.5 rounded-xl bg-[#1F2627] hover:bg-[#121617] text-[#F8F7F2]
            text-xs font-bold tracking-tight shadow-soft-sm hover:shadow-soft
            flex items-center gap-2 active:scale-[0.98] transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          "
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F8F7F2]" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Lưu & Kích hoạt Token</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
