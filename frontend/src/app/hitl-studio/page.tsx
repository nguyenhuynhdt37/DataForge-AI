import { Suspense } from 'react';
import { HitlStudioPageView } from '@/modules/hitl-studio';

export const metadata = {
  title: 'HITL Studio — DataForge AI',
  description: 'Giao diện gán nhãn chuyên nghiệp, tự động kiểm tra IoU Consensus và hỏi đáp SOP RAG',
};

export default function HitlStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <HitlStudioPageView />
    </Suspense>
  );
}
