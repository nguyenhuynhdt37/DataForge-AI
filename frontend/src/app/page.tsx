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

export default function TailwindDashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
            <Zap className="h-4 w-4 text-zinc-950" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">GreenSM</span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
            Active Learning
          </span>
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
      <main className="flex-1 p-6 md:p-8 lg:px-12 max-w-[1400px] mx-auto w-full">
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Tổng quan Pipeline YOLO11n
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Hệ thống giám sát hiệu suất nhận diện và tối ưu hoá dữ liệu gán nhãn.
            </p>
          </div>
          <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950">
            <Play className="h-4 w-4" />
            Bắt đầu Pipeline
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">Độ chính xác mục tiêu</span>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100">78.4%</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">+14.2%</span> so với V0 Baseline
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">IoU Đồng thuận Tự động</span>
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100">84.2%</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-blue-500 font-medium">Bởi RT-DETR</span> ở Tier 1
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-medium text-zinc-400">Tốc độ OpenVINO Edge</span>
              <Cpu className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100">21.4 FPS</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-purple-500 font-medium">4.2ms</span> trên CPU INT8
            </p>
          </div>
        </div>

        {/* 2 Cols Content */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          {/* Slices Breakdown */}
          <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col shadow-sm">
            <div className="border-b border-zinc-800 p-5">
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
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div 
                      className="h-full bg-zinc-400 rounded-full transition-all duration-500" 
                      style={{ width: `${slice.val}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col shadow-sm">
            <div className="border-b border-zinc-800 p-5">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-zinc-400" />
                <h3 className="font-semibold text-zinc-100">Bảng điều khiển</h3>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200 text-sm">pHash Deduplication</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Lọc trùng lặp ảnh thô</div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-200 text-sm">Active Mining</div>
                    <div className="text-xs text-zinc-500 mt-0.5">Sẵn sàng 1,840 ảnh pool</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
