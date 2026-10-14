"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LogOut, 
  User, 
  FolderKanban, 
  ChevronDown,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useAuthStore } from '@/shared/lib/authStore';
import { AnimatedContent } from '@/shared/components/react-bits';

export interface UserMenuDropdownProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  variant = 'light',
  className = '',
}) => {
  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đảm bảo client mount trước để tránh mismatch hydration SSR
  useEffect(() => {
    setIsMounted(true);
    initializeAuth();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        initializeAuth();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [initializeAuth]);

  // Đóng dropdown khi click outside hoặc ấn Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (err: unknown) {
      console.error('Lỗi khi thực hiện đăng xuất:', err);
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  }, [logout]);

  const initials = useMemo(() => {
    if (!user) return 'DF';
    if (user.full_name) {
      const parts = user.full_name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'DF';
  }, [user]);

  const isDark = variant === 'dark';

  if (!isMounted) {
    return (
      <div className={`h-8 w-24 rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-[#E5E3DC]'} ${className}`} />
    );
  }

  // Trường hợp KHÁCH CHƯA ĐĂNG NHẬP
  if (!isAuthenticated || !user) {
    return (
      <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
        <Link
          href="/login"
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
            isDark
              ? 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              : 'text-[#303A3B] hover:text-[#2D5A34] hover:bg-[#F2F1EB]'
          }`}
        >
          Đăng nhập
        </Link>

        <Link
          href="/projects"
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-soft-sm active:scale-[0.98] ${
            isDark
              ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
              : 'bg-[#B7CDBB] hover:bg-[#a6c2ac] text-[#303A3B] hover:shadow-soft'
          }`}
        >
          <span>Workspace</span>
        </Link>
      </div>
    );
  }

  // Vai trò gọn gàng: Chỉ ADMIN hoặc MEMBER
  const roleLabel = user.is_admin ? 'ADMIN' : 'MEMBER';

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {/* Nút Kích Hoạt Menu Người Dùng */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Menu tài khoản"
        className={`group flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border transition-all cursor-pointer ${
          isDark
            ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border-zinc-800 hover:border-zinc-700 shadow-sm'
            : 'bg-white hover:bg-[#F8F7F2] text-[#303A3B] border-[#E5E3DC] hover:border-[#B7CDBB] shadow-soft-sm'
        }`}
      >
        {/* Avatar */}
        <div
          className={`relative h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center font-bold text-xs select-none shrink-0 ${
            user.is_admin
              ? isDark
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-[#FAF2E8] text-[#8C6239] border border-[#EEDFCD]'
              : isDark
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]'
          }`}
        >
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.full_name || 'User avatar'}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Tên & Role Badge */}
        <div className="hidden sm:flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold leading-tight truncate max-w-[120px] font-editorial">
              {user.full_name || user.email.split('@')[0]}
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                user.is_admin
                  ? isDark
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-[#FAF2E8] text-[#8C6239] border border-[#EEDFCD]'
                  : isDark
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-[#E8F0EA] text-[#2D5A34]'
              }`}
            >
              {roleLabel}
            </span>
          </div>
          <span
            className={`text-[10px] truncate max-w-[120px] leading-tight font-mono ${
              isDark ? 'text-zinc-500' : 'text-[#6B7677]'
            }`}
          >
            {user.email}
          </span>
        </div>

        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-[#6B7677] group-hover:text-[#303A3B]'}`}
        />
      </button>

      {/* Dropdown Card Tinh Gọn */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl z-50 overflow-hidden ${
            isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-black/70'
              : 'bg-white border-[#E5E3DC] text-[#303A3B] shadow-soft-lg'
          }`}
        >
          <AnimatedContent distance={8} duration={0.2}>
            {/* Header Thẻ Người Dùng */}
            <div
              className={`p-3.5 border-b ${
                isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-[#E5E3DC] bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs select-none shrink-0 ${
                    user.is_admin
                      ? isDark
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-[#FAF2E8] text-[#8C6239] border border-[#EEDFCD]'
                      : isDark
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]'
                  }`}
                >
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs truncate font-editorial">
                    {user.full_name || 'Thành viên'}
                  </div>
                  <div
                    className={`text-[11px] truncate font-mono mt-0.5 ${
                      isDark ? 'text-zinc-400' : 'text-[#6B7677]'
                    }`}
                  >
                    {user.email}
                  </div>
                  {user.cvat_username && (
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>CVAT: @{user.cvat_username}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="p-1.5 space-y-0.5 text-xs">
              <Link
                href="/projects"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  isDark
                    ? 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'hover:bg-[#F8F7F2] text-[#303A3B]'
                }`}
              >
                <FolderKanban className="h-4 w-4 text-[#7FA086]" />
                <span className="font-medium">Quản trị Dự án</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  isDark
                    ? 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
                    : 'hover:bg-[#F8F7F2] text-[#303A3B]'
                }`}
              >
                <Settings className="h-4 w-4 text-[#7FA086]" />
                <span className="font-medium">Cài đặt tài khoản</span>
              </Link>

              {user.cvat_username && (
                <a
                  href="https://cvat.itup.io.vn"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                    isDark
                      ? 'hover:bg-zinc-900 text-zinc-300 hover:text-white'
                      : 'hover:bg-[#F8F7F2] text-[#303A3B]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-[#7FA086]" />
                    <span className="font-medium">Mở Kho CVAT Host</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-70">itup.io.vn</span>
                </a>
              )}
            </div>

            {/* Nút Đăng Xuất */}
            <div
              className={`p-1.5 border-t ${
                isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-[#E5E3DC] bg-[#FAF9F5]'
              }`}
            >
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                  isDark
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{isLoggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
              </button>
            </div>
          </AnimatedContent>
        </div>
      )}
    </div>
  );
};
