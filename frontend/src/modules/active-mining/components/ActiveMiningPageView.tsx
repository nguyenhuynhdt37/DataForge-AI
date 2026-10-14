"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Target, ChevronLeft, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { RetroGrid } from '@/shared/components/react-bits/RetroGrid';
import { ShinyText } from '@/shared/components/react-bits/ShinyText';
import { PcaScatterPlot } from './PcaScatterPlot';
import { WeightSliderPanel } from './WeightSliderPanel';
import { SamplingConfigCard } from './SamplingConfigCard';
import { ScoreFormulaDisplay } from './ScoreFormulaDisplay';
import { CandidateList } from './CandidateList';
import { usePcaCanvas } from '../hooks/usePcaCanvas';
import { useActiveWeights } from '../hooks/useActiveWeights';
import { activeMiningApi } from '../services/activeMiningApi';
import { AppHeader } from '@/shared/components/layout';

export const ActiveMiningPageView: React.FC = () => {
  const { points, isLoading } = usePcaCanvas();
  const { weights, updateWeights } = useActiveWeights();
  const [budget, setBudget] = useState<number>(25);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRunKCenter = async () => {
    setIsSolving(true);
    try {
      const res = await activeMiningApi.runKCenter({
        budget,
        weights,
      });
      if (res.data?.selectedSampleIds) {
        setSelectedCandidateIds(res.data.selectedSampleIds);
      } else {
        // Fallback chọn các mẫu có isHardSlice cao nhất
        const picked = points
          .filter((p) => p.isHardSlice)
          .slice(0, budget)
          .map((p) => String(p.id));
        setSelectedCandidateIds(picked);
      }
      setToastMessage(`Đã chọn lọc thành công ${budget} mẫu ca khó tối ưu cho ngân sách gán nhãn!`);
      setTimeout(() => setToastMessage(null), 4500);
    } catch {
      const picked = points
        .filter((p) => p.isHardSlice)
        .slice(0, budget)
        .map((p) => String(p.id));
      setSelectedCandidateIds(picked);
      setToastMessage(`Đã chạy giải thuật k-Center (Mô phỏng): Đã chọn ${picked.length} mẫu khó.`);
      setTimeout(() => setToastMessage(null), 4500);
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-950 selection:text-emerald-200">
      {/* Background Retro Grid */}
      <RetroGrid angle={65} className="top-0 z-0 opacity-40" />

      {/* 3-Zone Dark Minimalist AppHeader */}
      <AppHeader
        variant="dark"
        customActions={
          <Link
            href="/hitl-studio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <span>Đưa vào HITL Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* Main Content */}
      <main className="relative flex-1 max-w-[1500px] mx-auto w-full px-6 py-8 z-10 space-y-6">
        
        {/* Toast */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center justify-between text-xs font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
            <button 
              type="button"
              onClick={() => setToastMessage(null)} 
              className="text-emerald-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Target className="h-4 w-4" /> ACTIVE LEARNING V3 & HARD MINING ENGINE
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-editorial mt-1">
              <ShinyText text="Không Gian Nhúng 2D PCA & Khai Phá Ca Khó" />
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Điều chỉnh trọng số độ bất định (U), ca khó thời tiết (S), và độ đa dạng (D) để giải k-Center Greedy Coreset.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
              Tổng Pool: <strong className="text-emerald-400">{points.length}</strong> khung hình
            </span>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Scatter plot */}
          <div className="lg:col-span-8 space-y-6">
            <PcaScatterPlot
              points={points}
              selectedIds={selectedCandidateIds}
            />

            <ScoreFormulaDisplay weights={weights} />
          </div>

          {/* Cột phải: Điều khiển trọng số, cấu hình budget và danh sách ứng viên */}
          <div className="lg:col-span-4 space-y-6">
            <SamplingConfigCard
              budget={budget}
              onBudgetChange={setBudget}
              onRunKCenter={handleRunKCenter}
              isRunning={isSolving}
              totalPoolSize={points.length}
            />

            <WeightSliderPanel
              weights={weights}
              onChange={updateWeights}
              disabled={isSolving}
            />

            <CandidateList
              points={points}
              selectedIds={selectedCandidateIds}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
