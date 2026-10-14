import { Suspense } from 'react';
import { ActiveMiningPageView } from '@/modules/active-mining';

export const metadata = {
  title: 'Active Mining — DataForge AI',
  description: 'Trực quan hóa không gian 2D PCA Embedding và chọn lọc ca khó bằng k-Center Coreset',
};

export default function ActiveMiningPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <ActiveMiningPageView />
    </Suspense>
  );
}
