"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface PipelineTabItem {
  id: string;
  stepNumber: string;
  label: string;
  shortLabel: string;
  href: string;
  description: string;
}

export const PIPELINE_STAGES: PipelineTabItem[] = [
  {
    id: 'data-lab',
    stepNumber: '01',
    label: 'Data Lab',
    shortLabel: 'Lab',
    href: '/data-lab',
    description: 'Lát cắt dữ liệu & lọc trùng lặp',
  },
  {
    id: 'active-mining',
    stepNumber: '02',
    label: 'Active Mining',
    shortLabel: 'Mining',
    href: '/active-mining',
    description: 'Trích xuất ca khó k-Center & 2D PCA',
  },
  {
    id: 'hitl-studio',
    stepNumber: '03',
    label: 'HITL Studio',
    shortLabel: 'HITL',
    href: '/hitl-studio',
    description: 'Gán nhãn & Đồng thuận QA/QC hai cấp',
  },
  {
    id: 'benchmark',
    stepNumber: '04',
    label: 'Benchmark',
    shortLabel: 'Bench',
    href: '/benchmark',
    description: 'Đo lường OpenVINO INT8 & mAP',
  },
];

export interface PipelineNavTabsProps {
  variant?: 'light' | 'dark';
  currentProjectId?: string;
  compact?: boolean;
  className?: string;
}

export const PipelineNavTabs: React.FC<PipelineNavTabsProps> = ({
  variant = 'light',
  currentProjectId,
  compact = false,
  className = '',
}) => {
  const pathname = usePathname() || '';
  const isDark = variant === 'dark';

  const activeStageId = useMemo(() => {
    const matched = PIPELINE_STAGES.find((stage) => {
      if (stage.href === '/') return pathname === '/';
      return pathname === stage.href || pathname.startsWith(`${stage.href}/`);
    });
    return matched?.id || null;
  }, [pathname]);

  return (
    <nav
      aria-label="Quy trình MLOps 4 Chặng"
      className={`inline-flex items-center rounded-2xl p-1 border transition-all ${
        isDark
          ? 'bg-zinc-900/90 border-zinc-800/90 shadow-inner'
          : 'bg-[#EFECE6]/80 border-[#E5E3DC] shadow-soft-sm'
      } ${className}`}
    >
      <div className="flex items-center gap-1">
        {PIPELINE_STAGES.map((stage) => {
          const isActive = activeStageId === stage.id;
          const targetHref = currentProjectId
            ? `${stage.href}?projectId=${encodeURIComponent(currentProjectId)}`
            : stage.href;

          return (
            <Link
              key={stage.id}
              href={targetHref}
              title={`${stage.stepNumber} ${stage.label} — ${stage.description}`}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-[0.98] select-none ${
                  compact ? 'text-[11px] px-2.5 py-1' : ''
                } ${
                  isActive
                    ? isDark
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                      : 'bg-white text-[#2D5A34] border border-[#CDE0D1] shadow-soft-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent'
                    : 'text-[#6B7677] hover:text-[#303A3B] hover:bg-white/60 border border-transparent'
                }`}
              >
                {/* Step index badge */}
                <span
                  className={`font-mono text-[10px] font-bold tracking-tight px-1 py-0.5 rounded ${
                    isActive
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-[#E8F0EA] text-[#2D5A34]'
                      : isDark
                      ? 'text-zinc-500'
                      : 'text-[#8A9596]'
                  }`}
                >
                  {stage.stepNumber}
                </span>

                {/* Stage Label */}
                <span className="tracking-tight whitespace-nowrap">
                  {stage.label}
                </span>

                {/* Active Indicator dot */}
                {isActive && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      isDark ? 'bg-emerald-400' : 'bg-[#2D5A34]'
                    }`}
                  />
                )}
              </Link>
          );
        })}
      </div>
    </nav>
  );
};
