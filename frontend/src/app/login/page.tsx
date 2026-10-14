import { Suspense } from 'react';
import { LoginPageView } from '@/modules/auth';

export const metadata = {
  title: 'Đăng nhập — DataForge AI',
  description: 'DataForge AI — Editorial Vision & Active Learning Platform',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7F2]" />}>
      <LoginPageView />
    </Suspense>
  );
}
