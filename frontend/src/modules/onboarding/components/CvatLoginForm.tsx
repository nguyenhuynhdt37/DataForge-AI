"use client";

import React, { useState } from 'react';
import { Loader2, ShieldCheck, ArrowRight, User, Lock } from 'lucide-react';

interface CvatLoginFormProps {
  onSubmit: (username: string, pass: string) => Promise<boolean>;
  onDismiss: () => void;
  loading: boolean;
  isDark?: boolean;
}

export const CvatLoginForm: React.FC<CvatLoginFormProps> = ({
  onSubmit,
  onDismiss,
  loading,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    await onSubmit(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tên tài khoản */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-xs font-semibold text-[#1F2627] tracking-tight flex items-center justify-between">
          <span>Tên tài khoản CVAT Host</span>
          <span className="text-rose-600 font-bold">*</span>
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-[#5A6466] pointer-events-none flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Ví dụ: hoa_cvat, annotator_01..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#D5D2C8] bg-white text-[#1F2627] placeholder:text-[#5A6466]/70 text-xs sm:text-sm font-medium outline-none transition-all duration-150 focus:border-[#7FA086] focus:ring-4 focus:ring-[#7FA086]/25 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
            autoComplete="username"
            required
          />
        </div>
      </div>

      {/* Mật khẩu */}
      <div className="flex flex-col gap-1.5 text-left">
        <label className="text-xs font-semibold text-[#1F2627] tracking-tight flex items-center justify-between">
          <span>Mật khẩu tài khoản CVAT</span>
          <span className="text-rose-600 font-bold">*</span>
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-[#5A6466] pointer-events-none flex items-center justify-center">
            <Lock className="h-4 w-4" />
          </div>
          <input
            type="password"
            placeholder="Nhập mật khẩu máy chủ CVAT"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#D5D2C8] bg-white text-[#1F2627] placeholder:text-[#5A6466]/70 text-xs sm:text-sm font-medium outline-none transition-all duration-150 focus:border-[#7FA086] focus:ring-4 focus:ring-[#7FA086]/25 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {/* Ghi chú bảo mật an toàn */}
      <div className="flex items-center gap-2 text-[11px] text-[#5A6466] pt-0.5 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-[#2D5A34] shrink-0" />
        <span>Giao thức TLS/HTTPS mã hóa đầu cuối. Mật khẩu không lưu trong CSDL.</span>
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
          disabled={loading || !username.trim() || !password}
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
              <span>Xác thực & Liên kết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
