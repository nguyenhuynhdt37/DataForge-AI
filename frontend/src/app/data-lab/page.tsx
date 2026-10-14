import { Suspense } from 'react';
import { DataLabPageView } from '@/modules/data-lab';

export const metadata = {
  title: 'Data Lab — DataForge AI',
  description: 'Quản trị lát cắt dữ liệu, lọc trùng lặp hành trình và kiểm thử ca khó',
};

export default function DataLabPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7F2]" />}>
      <DataLabPageView />
    </Suspense>
  );
}
