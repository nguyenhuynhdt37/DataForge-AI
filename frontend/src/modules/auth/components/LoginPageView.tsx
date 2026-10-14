"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { SplitText } from '@/shared/components/react-bits';
import { useAuthStore } from '../store/useAuthStore';
import { BrandHeader } from './BrandHeader';
import { LoginForm } from './LoginForm';
import { OtpVerificationForm } from './OtpVerificationForm';
import { EditorialVisualPanel } from './EditorialVisualPanel';

export function LoginPageView() {
  const router = useRouter();

  const { 
    requiresOtp, 
    error, 
    isAuthenticated,
    initializeAuth 
  } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/projects');
    }
  }, [isAuthenticated, router]);

  const handleAuthSuccess = () => {
    router.push('/projects');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8F7F2] font-sans selection:bg-[#DCEBE0] selection:text-[#1F2627]">
      
      {/* LEFT COLUMN: AUTHENTICATION FORM (~45% width, Full Screen Height) */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 xl:p-14 overflow-y-auto">
        
        {/* Top Brand Header */}
        <div className="flex items-center justify-between">
          <BrandHeader />
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
            Enterprise MLOps
          </span>
        </div>

        {/* Center Form Area */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto text-left">
          
          {/* Header Titles (Không có dấu chấm tròn, typography sắc nét) */}
          <div className="mb-7">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#2D5A34] mb-2">
              {requiresOtp ? "BẢO MẬT 2 LỚP OTP" : "CỔNG ĐĂNG NHẬP HỆ THỐNG"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1F2627] font-editorial">
              {requiresOtp ? (
                "Xác thực Thiết bị mới"
              ) : (
                <SplitText text="Chào mừng trở lại" delay={25} />
              )}
            </h1>
            <p className="text-sm text-[#475254] mt-2 leading-relaxed">
              {requiresOtp
                ? "Nhập mã OTP bảo mật 6 số được gửi về email để bảo vệ phiên làm việc của bạn."
                : "Truy cập không gian làm việc và tối ưu hóa mô hình."}
            </p>
          </div>

          {/* Backend Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in-50 duration-150">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-relaxed font-semibold">{error}</div>
            </div>
          )}

          {/* Active Form */}
          {requiresOtp ? (
            <OtpVerificationForm onSuccess={handleAuthSuccess} />
          ) : (
            <LoginForm onSuccess={handleAuthSuccess} />
          )}

        </div>

        {/* Bottom Footer Info (Dùng khoảng cách gap-4, không có dấu bullet) */}
        <div className="pt-4 border-t border-[#E5E3DC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#475254]">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="h-4 w-4 text-[#2D5A34]" />
            <span>Mã hóa đầu cuối & Bảo mật 2 lớp</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-[#1F2627] transition-colors underline-offset-2 hover:underline">
              Điều khoản
            </Link>
            <Link href="#" className="hover:text-[#1F2627] transition-colors underline-offset-2 hover:underline">
              Quyền riêng tư
            </Link>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: LARGE EDITORIAL VISUAL PANEL (~55% width, Full Screen Height) */}
      <div className="w-full lg:w-[52%] xl:w-[55%] p-3 sm:p-4 lg:p-6 hidden lg:flex items-stretch">
        <EditorialVisualPanel />
      </div>

    </div>
  );
}
