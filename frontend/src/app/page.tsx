"use client";

import React from 'react';
import { 
  Activity, 
  Settings2, 
  HardDrive, 
  BarChart3, 
  ShieldCheck, 
  Cpu, 
  Zap,
  Play
} from 'lucide-react';
import { ShinyText } from '@/shared/components/react-bits/ShinyText';
import { SpotlightCard } from '@/shared/components/react-bits/SpotlightCard';

export default function TailwindDashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col relative overflow-hidden">
      
      {/* Background Animated Retro Grid / Radial Fade (Inspired by React Bits) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/60 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Zap className="h-4 w-4 text-zinc-950" />
          </div>
          <ShinyText text="GreenSM MLOps" className="text-sm font-semibold tracking-tight" />
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
          <a href="#" className="text-emerald-500">Overview</a>
          <a href="#" className="hover:text-zinc-100 transition">Data Lab</a>
          <a href="#" className="hover:text-zinc-100 transition">Mining</a>
          <a href="#" className="hover:text-zinc-100 transition">HITL Studio</a>
          <a href="#" className="hover:text-zinc-100 transition">Reports</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 p-6 md:p-8 lg:px-12 max-w-[1400px] mx-auto w-full z-10">
        
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Tổng quan <ShinyText text="Pipeline YOLO11n" />
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Hệ thống giám sát hiệu suất nhận diện và tối ưu hoá dữ liệu gán nhãn thời gian thực.
            </p>
          </div>
          <button className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-md bg-emerald-500 px-5 text-sm font-medium text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
              <div className="relative h-full w-8 bg-white/20" />
            </div>
            <Play className="h-4 w-4" />
            Bắt đầu Pipeline
          </button>
        </div>

        {/* 3 Metric Spotlight Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.15)">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">Độ chính xác mục tiêu</span>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">78.4%</div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">+14.2%</span> so với V0 Baseline
            </p>
          </SpotlightCard>

          <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.15)">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">IoU Đồng thuận Tự động</span>
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">84.2%</div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <span className="text-blue-500 font-medium">Bởi RT-DETR</span> ở Tier 1
            </p>
          </SpotlightCard>

          <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.15)">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">Tốc độ OpenVINO Edge</span>
              <Cpu className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">21.4 FPS</div>
            <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
              <span className="text-purple-500 font-medium">4.2ms</span> trên CPU INT8
            </p>
          </SpotlightCard>
        </div>

        {/* 2 Cols Content with Spotlight Borders */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          <SpotlightCard className="lg:col-span-4 p-0 flex flex-col" spotlightColor="rgba(255,255,255,0.05)">
            <div className="border-b border-zinc-800/60 p-5">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-zinc-400" />
                <h3 className="font-semibold text-zinc-100">Cấu trúc 5 Lát cắt (Slices)</h3>
              </div>
            </div>
            <div className="flex-1 p-5 space-y-6">
              {[
                { name: 'Night Slice (Ban đêm)', val: 64.2, count: 420 },
                { name: 'Small Object (<32px)', val: 58.9, count: 510 },
                { name: 'Occlusion (Che khuất)', val: 61.5, count: 380 },
                { name: 'Dense Traffic (Ùn ứ)', val: 69.0, count: 320 },
              ].map((slice, i) => (
                <div key={i}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-300">{slice.name}</span>
                    <span className="text-zinc-500">{slice.count} ảnh • <span className="text-emerald-500 font-medium">{slice.val}%</span></span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/80">
                    <div 
                      className="h-full bg-zinc-400 rounded-full transition-all duration-1000" 
                      style={{ width: `${slice.val}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>

          <SpotlightCard className="lg:col-span-3 p-0 flex flex-col" spotlightColor="rgba(255,255,255,0.05)">
            <div className="border-b border-zinc-800/60 p-5">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-zinc-400" />
                <h3 className="font-semibold text-zinc-100">Bảng điều khiển</h3>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div className="group rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-4 hover:border-zinc-700 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200 text-sm">pHash Deduplication</div>
                    <div className="text-xs text-zinc-500 mt-1">Lọc trùng lặp ảnh thô</div>
                  </div>
                </div>
              </div>
              <div className="group rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-4 hover:border-zinc-700 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200 text-sm">Active Mining</div>
                    <div className="text-xs text-zinc-500 mt-1">Sẵn sàng 1,840 ảnh pool</div>
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
          
        </div>
      </main>
    </div>
  );
}
