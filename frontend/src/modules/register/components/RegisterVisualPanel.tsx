"use client";

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Users, Workflow } from 'lucide-react';

export function RegisterVisualPanel() {
  return (
    <div className="relative w-full h-full min-h-[580px] lg:min-h-full rounded-[28px] lg:rounded-[32px] overflow-hidden bg-[#FAF9F5] border border-[#E5E3DC] shadow-soft-sm flex items-center justify-center select-none">
      
      {/* Editorial Photograph */}
      <Image
        src="/images/team-collaboration.jpg"
        alt="DataForge AI Data Science Team"
        fill
        sizes="(max-width: 1024px) 100vw, 55vw"
        className="object-cover object-center"
        priority
      />

      {/* Subtle Warm Editorial Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F2627]/40 via-transparent to-black/10 pointer-events-none" />

      {/* FLOATING CARD 1: Community Onboarding (Top Right) */}
      <div className="absolute top-6 right-6 sm:top-7 sm:right-7 max-w-[300px] w-full p-5 sm:p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E3DC] shadow-soft-lg pointer-events-none">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A34] font-mono">
            Cộng đồng MLOps
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
            Đăng ký Mới
          </span>
        </div>

        <div className="text-sm font-bold text-[#1F2627] leading-snug">
          Gia nhập Đội ngũ Gán nhãn & Giám định
        </div>
        <div className="text-xs font-medium text-[#475254] mt-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-[#2A5778]" />
          <span>Hơn 24 thành viên đang hoạt động</span>
        </div>
      </div>

      {/* FLOATING CARD 2: Active Learning Pipeline (Bottom Left) */}
      <div className="absolute bottom-6 left-6 sm:bottom-7 sm:left-7 max-w-[320px] w-full p-5 sm:p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E3DC] shadow-soft-lg pointer-events-none">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-[#E8F0EA] border border-[#CDE0D1] flex items-center justify-center text-[#2D5A34]">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1F2627]">
              Quy trình Tinh hoa 4 Bước
            </div>
            <div className="text-xs text-[#475254] font-mono">
              Mining → HITL → Benchmark → Train
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs pt-1">
          <span className="px-2.5 py-1 rounded-md bg-[#FAF9F5] border border-[#E5E3DC] text-[#1F2627] font-mono font-medium">
            greensm
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF9F5] border border-[#E5E3DC] text-[#1F2627] font-mono font-medium">
            car
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#FAF9F5] border border-[#E5E3DC] text-[#1F2627] font-mono font-medium">
            motorcycle
          </span>
        </div>
      </div>

      {/* FLOATING CARD 3: Enterprise Security Badge (Bottom Right) */}
      <div className="hidden sm:flex absolute bottom-6 right-6 sm:bottom-7 sm:right-7 items-center gap-3.5 px-5 py-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E3DC] shadow-soft-lg pointer-events-none">
        <div className="h-10 w-10 rounded-xl bg-[#E6F0F7] border border-[#C6D9E8] flex items-center justify-center text-[#2A5778]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="text-sm font-bold text-[#1F2627]">Bảo mật cấp doanh nghiệp</div>
          <div className="text-xs font-medium text-[#475254]">Bảo mật dữ liệu 2 lớp</div>
        </div>
      </div>

    </div>
  );
}
