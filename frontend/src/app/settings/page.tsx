"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { SettingsPageView } from '@/modules/auth';
import { useAuthStore } from '@/shared/lib/authStore';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeAuth();
    setIsReady(true);
  }, [initializeAuth]);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.push('/login');
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F7F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#2D5A34] border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-[#5A6466]">Đang xác thực thông tin...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1F2627] flex flex-col">
      {/* Header thanh lịch Soft Editorial */}
      <AppHeader
        variant="light"
        showProjectSelector={false}
        showPipelineTabs={false}
      />

      {/* Nội dung chính */}
      <main className="flex-1 py-8 sm:py-10">
        <PageContainer maxWidth="default">
          <SettingsPageView />
        </PageContainer>
      </main>
    </div>
  );
}
