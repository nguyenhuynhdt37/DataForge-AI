"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Activity, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ProjectItem } from '@/modules/projects/types';
import { ProjectSelectorDropdown } from './ProjectSelectorDropdown';
import { PipelineNavTabs } from './PipelineNavTabs';
import { UserMenuDropdown } from './UserMenuDropdown';
import { AnimatedContent } from '@/shared/components/react-bits';
import { useAuthStore } from '@/shared/lib/authStore';

export interface AppHeaderProps {
  variant?: 'light' | 'dark' | 'auto';
  compact?: boolean;
  showProjectSelector?: boolean;
  showPipelineTabs?: boolean;
  currentProjectId?: string;
  onSelectProject?: (project: ProjectItem) => void;
  customActions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  variant = 'auto',
  compact = false,
  showProjectSelector,
  showPipelineTabs,
  currentProjectId,
  onSelectProject,
  customActions,
  breadcrumbs,
  className = '',
}) => {
  const pathname = usePathname() || '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();

  // Đóng mobile menu khi chuyển route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Tự động suy luận chế độ Light / Dark dựa vào pathname nếu variant = 'auto'
  const computedVariant = useMemo<'light' | 'dark'>(() => {
    if (variant === 'light' || variant === 'dark') return variant;
    if (pathname.startsWith('/hitl-studio') || pathname.startsWith('/active-mining')) {
      return 'dark';
    }
    return 'light';
  }, [variant, pathname]);

  const isDark = computedVariant === 'dark';

  // Xác định xem có phải trang Landing Overview không
  const isLandingPage = pathname === '/';

  // Tự động hiển thị Project Selector nếu không truyền tường minh
  const shouldShowProjectSelector = useMemo(() => {
    if (typeof showProjectSelector === 'boolean') return showProjectSelector;
    return !isLandingPage;
  }, [showProjectSelector, isLandingPage]);

  // Tự động hiển thị Pipeline Tabs
  const shouldShowPipelineTabs = useMemo(() => {
    if (typeof showPipelineTabs === 'boolean') return showPipelineTabs;
    return !isLandingPage;
  }, [showPipelineTabs, isLandingPage]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors backdrop-blur-md ${
        compact ? 'h-14' : 'h-16'
      } ${
        isDark
          ? 'bg-zinc-950/85 border-b border-zinc-800 text-zinc-100'
          : 'bg-[#F8F7F2]/90 border-b border-[#E5E3DC] text-[#303A3B]'
      } ${className}`}
    >
      <div className="mx-auto h-full w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* ============================================================== */}
        {/* KHỐI 1: KHỐI TRÁI (ZONE LEFT) - NHẬN DIỆN & BỐI CẢNH DỰ ÁN       */}
        {/* ============================================================== */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <div
              className={`relative rounded-xl overflow-hidden p-1 transition-all ${
                compact ? 'h-8 w-8' : 'h-9 w-9'
              } ${
                isDark
                  ? 'bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 shadow-sm'
                  : 'bg-white border border-[#E5E3DC] group-hover:border-[#B7CDBB] shadow-soft-sm'
              }`}
            >
              <Image
                src="/logo.png"
                alt="DataForge AI Logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>

            <span
              className={`font-bold tracking-tight font-editorial ${
                compact ? 'text-sm' : 'text-base'
              } ${isDark ? 'text-white' : 'text-[#303A3B]'}`}
            >
              DataForge AI
            </span>
          </Link>

          {/* Vách Ngăn Phân Tách Nhẹ */}
          <div
            className={`hidden sm:block h-5 w-px ${
              isDark ? 'bg-zinc-800' : 'bg-[#E5E3DC]'
            }`}
          />

          {/* Breadcrumb Tùy Biến (nếu trang như HITL Studio cần hiển thị Batch/Frame) */}
          {breadcrumbs && (
            <div className="hidden md:flex items-center">
              {breadcrumbs}
            </div>
          )}

          {/* Bộ Chọn Bối Cảnh Dự Án (Project Selector Dropdown) */}
          {shouldShowProjectSelector && !breadcrumbs && (
            <div className="hidden sm:block">
              <ProjectSelectorDropdown
                currentProjectId={currentProjectId}
                onSelectProject={onSelectProject}
                variant={computedVariant}
              />
            </div>
          )}

          {/* Badge Chế Độ Workspace nếu là Landing */}
          {isLandingPage && (
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                isDark
                  ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  : 'bg-[#E8F0EA] text-[#2D5A34] border-[#CDE0D1]'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>MLOps Platform</span>
            </span>
          )}
        </div>

        {/* ============================================================== */}
        {/* KHỐI 2: KHỐI GIỮA (ZONE CENTER) - ĐIỀU HƯỚNG PIPELINE 4 CHẶNG    */}
        {/* ============================================================== */}
        <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl px-2">
          {shouldShowPipelineTabs ? (
            <PipelineNavTabs
              variant={computedVariant}
              currentProjectId={currentProjectId}
              compact={compact}
            />
          ) : (
            /* Điều hướng chính cho trang Landing */
            <nav className="flex items-center gap-6 text-xs font-semibold tracking-wide">
              <Link
                href="/"
                className={`transition-colors pb-1 border-b-2 ${
                  pathname === '/'
                    ? isDark
                      ? 'border-emerald-500 text-white'
                      : 'border-[#B7CDBB] text-[#303A3B]'
                    : isDark
                    ? 'border-transparent text-zinc-400 hover:text-white'
                    : 'border-transparent text-[#6B7677] hover:text-[#303A3B]'
                }`}
              >
                Tổng quan
              </Link>
              <Link
                href="/projects"
                className={`transition-colors pb-1 border-b-2 border-transparent ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-[#6B7677] hover:text-[#303A3B]'
                }`}
              >
                Dự án Workspace
              </Link>
              <Link
                href="/data-lab"
                className={`transition-colors pb-1 border-b-2 border-transparent ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-[#6B7677] hover:text-[#303A3B]'
                }`}
              >
                Data Lab
              </Link>
              <Link
                href="/active-mining"
                className={`transition-colors pb-1 border-b-2 border-transparent ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-[#6B7677] hover:text-[#303A3B]'
                }`}
              >
                Active Mining
              </Link>
              <Link
                href="/hitl-studio"
                className={`transition-colors pb-1 border-b-2 border-transparent ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-[#6B7677] hover:text-[#303A3B]'
                }`}
              >
                HITL Studio
              </Link>
              <Link
                href="/benchmark"
                className={`transition-colors pb-1 border-b-2 border-transparent ${
                  isDark ? 'text-zinc-400 hover:text-white' : 'text-[#6B7677] hover:text-[#303A3B]'
                }`}
              >
                Benchmark
              </Link>
            </nav>
          )}
        </div>

        {/* ============================================================== */}
        {/* KHỐI 3: KHỐI PHẢI (ZONE RIGHT) - TELEMETRY & NGƯỜI DÙNG         */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* MLOps Cluster Telemetry Status Pill (Đèn tĩnh trang nhã) */}
          <div
            title="Trạng thái hệ thống: FastAPI 200 OK & MinIO S3 Sẵn sàng"
            className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium border select-none ${
              isDark
                ? 'bg-zinc-900/90 text-zinc-300 border-zinc-800'
                : 'bg-white text-[#475254] border-[#E5E3DC] shadow-soft-sm'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isDark ? 'bg-emerald-400' : 'bg-[#2D5A34]'
              }`}
            />
            <span>FastAPI 200 OK</span>
          </div>

          {/* Các nút hành động riêng của từng trang (Slot) */}
          {customActions && (
            <div className="flex items-center gap-2">
              {customActions}
            </div>
          )}



          {/* Menu Người Dùng & Nút Đăng Xuất */}
          <UserMenuDropdown variant={computedVariant} />

          {/* Nút Hamburger Mở Menu Trên Thiết Bị Di Động */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Mở danh mục điều hướng"
            className={`p-2 rounded-xl border lg:hidden transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'bg-white border-[#E5E3DC] text-[#303A3B] hover:bg-[#F2F1EB]'
            }`}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* DRAWER ĐIỀU HƯỚNG TRÊN THIẾT BỊ DI ĐỘNG (MOBILE MENU)           */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-b shadow-xl px-4 py-4 space-y-4 ${
            isDark
              ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-xl'
              : 'bg-[#F8F7F2]/98 border-[#E5E3DC] text-[#303A3B] backdrop-blur-xl shadow-soft-lg'
          }`}
        >
          <AnimatedContent distance={12} duration={0.25}>
            {/* Bộ Chọn Dự Án Trên Mobile */}
            {shouldShowProjectSelector && (
              <div className="pb-3 border-b border-[#E5E3DC] dark:border-zinc-800">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2D5A34] dark:text-emerald-400 mb-2">
                  Chiến dịch Hiện tại
                </div>
                <ProjectSelectorDropdown
                  currentProjectId={currentProjectId}
                  onSelectProject={onSelectProject}
                  variant={computedVariant}
                  className="w-full"
                />
              </div>
            )}

            {/* Các Chặng Pipeline Trên Mobile */}
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#6B7677] dark:text-zinc-500 mb-2">
                Quy trình MLOps 4 Chặng
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/data-lab"
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                    pathname === '/data-lab'
                      ? isDark
                        ? 'bg-zinc-800 text-emerald-400 border-emerald-500/30'
                        : 'bg-white text-[#2D5A34] border-[#CDE0D1]'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      : 'bg-white border-[#E5E3DC] text-[#303A3B]'
                  }`}
                >
                  <span>01 Data Lab</span>
                  <ArrowRight className="h-3 w-3 opacity-60" />
                </Link>

                <Link
                  href="/active-mining"
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                    pathname === '/active-mining'
                      ? isDark
                        ? 'bg-zinc-800 text-emerald-400 border-emerald-500/30'
                        : 'bg-white text-[#2D5A34] border-[#CDE0D1]'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      : 'bg-white border-[#E5E3DC] text-[#303A3B]'
                  }`}
                >
                  <span>02 Active Mining</span>
                  <ArrowRight className="h-3 w-3 opacity-60" />
                </Link>

                <Link
                  href="/hitl-studio"
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                    pathname === '/hitl-studio'
                      ? isDark
                        ? 'bg-zinc-800 text-emerald-400 border-emerald-500/30'
                        : 'bg-white text-[#2D5A34] border-[#CDE0D1]'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      : 'bg-white border-[#E5E3DC] text-[#303A3B]'
                  }`}
                >
                  <span>03 HITL Studio</span>
                  <ArrowRight className="h-3 w-3 opacity-60" />
                </Link>

                <Link
                  href="/benchmark"
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                    pathname === '/benchmark'
                      ? isDark
                        ? 'bg-zinc-800 text-emerald-400 border-emerald-500/30'
                        : 'bg-white text-[#2D5A34] border-[#CDE0D1]'
                      : isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                      : 'bg-white border-[#E5E3DC] text-[#303A3B]'
                  }`}
                >
                  <span>04 Benchmark</span>
                  <ArrowRight className="h-3 w-3 opacity-60" />
                </Link>
              </div>
            </div>

            {/* Trạng Thái Cụm MLOps Trên Mobile */}
            <div className="pt-2 flex items-center justify-between text-xs text-[#6B7677] dark:text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                <span>Backend FastAPI & MinIO</span>
              </span>
              <span className="text-[#2D5A34] dark:text-emerald-400 font-bold">200 OK</span>
            </div>
          </AnimatedContent>
        </div>
      )}

    </header>
  );
};
