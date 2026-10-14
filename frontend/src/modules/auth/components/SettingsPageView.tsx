"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  User, 
  KeyRound, 
  Laptop, 
  Database, 
  ShieldCheck, 
  Award, 
  Layers, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ProfileInfoSection } from './ProfileInfoSection';
import { SecuritySection } from './SecuritySection';
import { SessionManagementSection } from './SessionManagementSection';
import { CvatIntegrationSection } from './CvatIntegrationSection';
import { AnimatedContent } from '@/shared/components/react-bits/AnimatedContent';
import { CountUp } from '@/shared/components/react-bits/CountUp';

type SettingsTab = 'profile' | 'security' | 'sessions' | 'cvat';

export const SettingsPageView: React.FC = () => {
  const { user, initializeAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    initializeAuth();
  }, [initializeAuth]);

  // Initials viết tắt tên
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

  const navItems = [
    {
      id: 'profile' as SettingsTab,
      label: 'Thông tin cá nhân & Avatar',
      description: 'Họ tên, ảnh đại diện, chức danh',
      icon: User,
    },
    {
      id: 'security' as SettingsTab,
      label: 'Bảo mật & Đổi mật khẩu',
      description: 'Quản lý khóa đăng nhập hệ thống',
      icon: KeyRound,
    },
    {
      id: 'sessions' as SettingsTab,
      label: 'Thiết bị & Phiên làm việc',
      description: 'Theo dõi các phiên đang đăng nhập',
      icon: Laptop,
    },
    {
      id: 'cvat' as SettingsTab,
      label: 'Kho Gán nhãn CVAT Host',
      description: 'Liên kết máy chủ CVAT Enterprise',
      icon: Database,
    },
  ];

  if (!isMounted) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#2D5A34] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Tiêu đề trang Soft Editorial */}
      <div className="space-y-1.5 pb-2 border-b border-[#ECEAE2]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
            ACCOUNT MANAGEMENT
          </span>
          <span className="text-[11px] font-mono text-[#5A6466]">
            DATA FORGE MLOPS STUDIO
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2627] font-editorial">
          Cài đặt Tài khoản & Hồ sơ Cá nhân
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6466] max-w-2xl">
          Tùy chỉnh thông tin định danh, bảo mật phiên làm việc và quản lý liên kết kho dữ liệu gán nhãn phục vụ huấn luyện mô hình.
        </p>
      </div>

      {/* Bố cục 2 cột Soft Editorial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (4 cols): TỔNG QUAN TÀI KHOẢN & TABS NAVIGATION */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Tóm Tắt Người Dùng */}
          <div className="p-6 rounded-3xl bg-[#FDFCFA] border border-[#E5E3DC] shadow-soft-sm text-center">
            {/* Avatar lớn */}
            <div className="relative mx-auto w-24 h-24 rounded-3xl overflow-hidden border-2 border-[#E5E3DC] bg-[#FAF9F5] shadow-soft flex items-center justify-center">
              {user?.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name || 'Avatar'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-3xl font-bold font-editorial text-[#2D5A34]">
                  {initials}
                </span>
              )}
            </div>

            {/* Thông tin chính */}
            <div className="mt-4 space-y-1">
              <h2 className="text-lg font-bold text-[#1F2627] font-editorial">
                {user?.full_name || 'Thành viên'}
              </h2>
              <p className="text-xs font-mono text-[#5A6466] truncate px-2">
                {user?.email}
              </p>
              {user?.title && (
                <p className="text-xs font-medium text-[#2D5A34] pt-0.5">
                  {user.title}
                </p>
              )}
            </div>

            {/* Role Badge */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                  user?.is_admin
                    ? 'bg-[#FAF2E8] text-[#8C6239] border-[#EEDFCD]'
                    : 'bg-[#E8F0EA] text-[#2D5A34] border-[#CDE0D1]'
                }`}
              >
                {user?.is_admin ? 'HỆ THỐNG ADMIN' : 'THÀNH VIÊN MEMBER'}
              </span>

              {user?.cvat_username && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A34] inline-block" />
                  CVAT: @{user.cvat_username}
                </span>
              )}
            </div>

            {/* Chỉ số Thống kê gán nhãn */}
            <div className="mt-6 pt-5 border-t border-[#ECEAE2] grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#ECEAE2] text-center">
                <div className="text-[10px] font-mono uppercase text-[#5A6466] flex items-center justify-center gap-1">
                  <Layers className="w-3 h-3 text-[#7FA086]" />
                  <span>Đã gán nhãn</span>
                </div>
                <div className="mt-1 text-base font-bold font-mono text-[#1F2627]">
                  <CountUp to={user?.total_annotated || 0} duration={1} />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF9F5] border border-[#ECEAE2] text-center">
                <div className="text-[10px] font-mono uppercase text-[#5A6466] flex items-center justify-center gap-1">
                  <Award className="w-3 h-3 text-[#7FA086]" />
                  <span>Độ chính xác</span>
                </div>
                <div className="mt-1 text-base font-bold font-mono text-[#2D5A34]">
                  <CountUp to={user?.accuracy_rate || 0} duration={1} decimals={1} />%
                </div>
              </div>
            </div>
          </div>

          {/* Danh mục điều hướng Tabs */}
          <div className="p-2 rounded-3xl bg-[#FDFCFA] border border-[#E5E3DC] shadow-soft-sm space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all duration-150 flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#E8F0EA] border border-[#CDE0D1] text-[#2D5A34] shadow-soft-sm'
                      : 'hover:bg-[#FAF9F5] text-[#1F2627] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isActive
                          ? 'bg-[#2D5A34] text-white border-[#2D5A34]'
                          : 'bg-[#FAF9F5] text-[#5A6466] border-[#ECEAE2]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">
                        {item.label}
                      </div>
                      <div className="text-[11px] font-mono text-[#5A6466] leading-tight mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isActive ? 'text-[#2D5A34] translate-x-0.5' : 'text-[#A0ABA8]'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI (8 cols): NỘI DUNG CHI TIẾT THEO TAB */}
        <div className="lg:col-span-8">
          <AnimatedContent distance={15} duration={0.25} key={activeTab}>
            {activeTab === 'profile' && <ProfileInfoSection />}
            {activeTab === 'security' && <SecuritySection />}
            {activeTab === 'sessions' && <SessionManagementSection />}
            {activeTab === 'cvat' && <CvatIntegrationSection />}
          </AnimatedContent>
        </div>
      </div>
    </div>
  );
};
