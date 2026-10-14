"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { SplitText } from '@/shared/components/react-bits';
import { RegisterForm } from './RegisterForm';
import { RegisterVisualPanel } from './RegisterVisualPanel';
import { useAuthStore } from '@/modules/auth/store/useAuthStore';

export function RegisterPageView() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/projects');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8F7F2] font-sans selection:bg-[#DCEBE0] selection:text-[#1F2627]">
      
      {/* LEFT COLUMN: REGISTRATION FORM (~45% width, Full Screen Height) */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 xl:p-14 overflow-y-auto">
        
        {/* Top Brand Header với Logo trong suốt */}
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-3.5 group transition-opacity hover:opacity-90"
          >
            <div className="relative h-10 w-10 shrink-0">
              <Image 
                src="/logo.png" 
                alt="DataForge AI Logo" 
                fill 
                className="object-contain" 
                priority
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-bold tracking-tight text-[#1F2627] font-editorial leading-tight">
                DataForge AI
              </span>
              <span className="text-xs uppercase font-mono tracking-wider text-[#475254] font-semibold">
                Editorial Vision Platform
              </span>
            </div>
          </Link>

          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
            Enterprise MLOps
          </span>
        </div>

        {/* Center Form Area */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto text-left">
          
          <div className="mb-7">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#2D5A34] mb-2">
              ĐĂNG KÝ THÀNH VIÊN MỚI
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1F2627] font-editorial">
              <SplitText text="Khởi tạo tài khoản" delay={25} />
            </h1>
            <p className="text-sm text-[#475254] mt-2 leading-relaxed">
              Nền tảng kiểm định và tinh chỉnh dữ liệu thị giác máy tính xe điện thông minh.
            </p>
          </div>

          {/* Form component */}
          <RegisterForm />

        </div>

        {/* Bottom Footer Info */}
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
        <RegisterVisualPanel />
      </div>

    </div>
  );
}
