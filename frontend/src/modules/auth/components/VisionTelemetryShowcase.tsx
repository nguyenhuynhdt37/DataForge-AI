"use client";

import React from 'react';
import Image from 'next/image';
import { Cpu, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SplitText, BlurText, SpotlightCard } from '@/shared/components/react-bits';

export function VisionTelemetryShowcase() {
  return (
    <div className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-10 xl:p-14 border-r border-[#E5E3DC] bg-[#F8F7F2]/60">
      
      {/* Top Header & Branding với Logo mới */}
      <div>
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#E8F0EA] border border-[#D5E4D8] text-[#303A3B] text-xs font-semibold tracking-wide">
          <div className="relative h-4 w-4 rounded-sm overflow-hidden">
            <Image src="/logo.png" alt="DataForge AI" fill className="object-contain" />
          </div>
          <span>DATAFORGE AI — DATA-CENTRIC VISION SUITE</span>
        </div>

        <h1 className="mt-6 text-3xl xl:text-4xl font-extrabold tracking-tight text-[#303A3B] leading-tight font-editorial">
          <SplitText text="Hạ tầng Dữ liệu Tinh tuyển" delay={25} className="block" />
          <span className="text-[#4E7756] block mt-1">
            <SplitText text="Cho Đội xe Thông minh" delay={35} />
          </span>
        </h1>

        <div className="mt-3 text-sm text-[#6B7677] max-w-xl leading-relaxed">
          <BlurText 
            text="Đồng bộ hóa luồng video camera hành trình, lọc trích ca khó tự động và thiết lập cơ chế đồng thuận QA/QC hai cấp độ."
            delay={30}
          />
        </div>
      </div>

      {/* Hero Showcase Image trong SpotlightCard */}
      <SpotlightCard 
        className="my-6 p-0 overflow-hidden bg-white border border-[#E5E3DC] shadow-soft rounded-2xl"
        spotlightColor="rgba(183, 205, 187, 0.25)"
      >
        <div className="relative w-full h-64 xl:h-72 overflow-hidden bg-slate-100">
          <Image
            src="/images/greensm-daylight.jpg"
            alt="Telemetry Vision Feed"
            fill
            priority
            className="object-cover object-center hover:scale-102 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#303A3B]/60 via-transparent to-transparent" />

          {/* Floating Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-[#E5E3DC] text-xs font-semibold text-[#303A3B] shadow-soft-sm">
            <Activity className="h-3.5 w-3.5 text-[#4E7756]" />
            <span>VINFAST VF8 — THỰC ĐỊA ĐÔ THỊ</span>
          </div>

          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-md border border-[#E5E3DC] text-[11px] font-mono font-medium text-[#6B7677] shadow-soft-sm">
            Edge INT8 | 60 FPS
          </div>

          {/* Bottom Overlay on Image */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-medium text-white drop-shadow">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-[#B7CDBB] text-[#303A3B] font-bold text-[11px]">
                IoU: 84.2%
              </span>
              <span>
                Độ trễ Edge: <strong>4.2ms</strong>
              </span>
            </div>
            <div className="text-slate-100 text-xs font-editorial">
              Mô hình: YOLO11n-GSM v3.0
            </div>
          </div>
        </div>

        {/* 3 Tech Pillars Strip */}
        <div className="grid grid-cols-3 divide-x divide-[#E5E3DC] border-t border-[#E5E3DC] bg-white p-4">
          <div className="px-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EBF3ED] text-[#4E7756] shrink-0">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#303A3B]">OpenVINO Edge</div>
              <div className="text-[11px] text-[#6B7677]">Tối ưu hóa INT8</div>
            </div>
          </div>

          <div className="px-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#E6F0F7] text-[#3D6B8C] shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#303A3B]">Active Mining</div>
              <div className="text-[11px] text-[#6B7677]">Trích xuất ca khó</div>
            </div>
          </div>

          <div className="px-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EFEBF5] text-[#5C4D78] shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#303A3B]">HITL Studio</div>
              <div className="text-[11px] text-[#6B7677]">Đồng thuận QA/QC</div>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Clean Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E5E3DC] text-xs text-[#6B7677]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#4E7756]" />
          <span>Mã hóa đầu cuối SSL/TLS</span>
        </div>
        <div>
          © 2026 DataForge AI
        </div>
      </div>

    </div>
  );
}
