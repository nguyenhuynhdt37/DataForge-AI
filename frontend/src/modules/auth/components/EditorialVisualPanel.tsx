"use client";

import React from 'react';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';

export function EditorialVisualPanel() {
  return (
    <div className="relative w-full h-full min-h-[580px] lg:min-h-full rounded-[28px] lg:rounded-[32px] overflow-hidden bg-[#FAF9F5] border border-[#E5E3DC] shadow-soft-sm flex items-center justify-center select-none">
      
      {/* Editorial Photograph (Static, crisp, no hover scale) */}
      <Image
        src="/images/team-collaboration.jpg"
        alt="DataForge AI Engineering Team Collaborating"
        fill
        sizes="(max-width: 1024px) 100vw, 55vw"
        className="object-cover object-center"
        priority
      />

      {/* Subtle Warm Tone Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F2627]/40 via-transparent to-black/10 pointer-events-none" />

      {/* FLOATING CARD 1: Active Learning Pipeline Status (Top Right) */}
      <div className="absolute top-6 right-6 sm:top-7 sm:right-7 max-w-[300px] w-full p-5 sm:p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E3DC] shadow-soft-lg pointer-events-none">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A34] font-mono">
            Batch 04 In Loop
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
            IoU 0.88
          </span>
        </div>

        <div className="text-sm font-bold text-[#1F2627] leading-snug">
          Active Learning Curation
        </div>
        <div className="text-xs font-medium text-[#475254] mt-1.5 flex items-center justify-between">
          <span>42 / 50 frames auto-verified</span>
          <span className="font-mono text-[#1F2627] font-bold">84%</span>
        </div>

        {/* Mini progress bar */}
        <div className="w-full h-2 bg-[#EFECE2] rounded-full overflow-hidden mt-3">
          <div className="h-full bg-[#7FA086] rounded-full w-[84%]" />
        </div>
      </div>

      {/* FLOATING CARD 2: Edge Inference Telemetry (Bottom Left) */}
      <div className="absolute bottom-6 left-6 sm:bottom-7 sm:left-7 max-w-[320px] w-full p-5 sm:p-6 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E3DC] shadow-soft-lg pointer-events-none">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#E6F0F7] border border-[#C6D9E8] flex items-center justify-center text-[#2A5778]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1F2627]">
                YOLO11n Edge INT8
              </div>
              <div className="text-xs text-[#475254] font-mono">
                Jetson Orin Nano
              </div>
            </div>
          </div>
          <span className="inline-flex items-center text-xs font-bold text-[#2D5A34] bg-[#E8F0EA] px-2.5 py-1 rounded-full border border-[#CDE0D1]">
            +4.2% mAP
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E5E3DC] text-left">
          <div>
            <div className="text-xs text-[#475254] uppercase font-mono font-semibold">Độ trễ (Latency)</div>
            <div className="text-base font-bold text-[#1F2627] font-mono mt-0.5">6.2 ms</div>
          </div>
          <div>
            <div className="text-xs text-[#475254] uppercase font-mono font-semibold">Tốc độ (Speed)</div>
            <div className="text-base font-bold text-[#1F2627] font-mono mt-0.5">161 FPS</div>
          </div>
        </div>
      </div>

      {/* FLOATING CARD 3: Quality Health Indicator (Bottom Right) */}
      <div className="hidden sm:flex absolute bottom-6 right-6 sm:bottom-7 sm:right-7 items-center gap-3.5 px-5 py-4 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E3DC] shadow-soft-lg pointer-events-none">
        <div className="h-10 w-10 rounded-xl bg-[#E8F0EA] border border-[#CDE0D1] flex items-center justify-center text-[#2D5A34]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="text-sm font-bold text-[#1F2627]">Data Health 98.4%</div>
          <div className="text-xs font-medium text-[#475254]">Khử trùng lặp hoàn tất</div>
        </div>
      </div>

    </div>
  );
}
