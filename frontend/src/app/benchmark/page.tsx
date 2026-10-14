import { Suspense } from 'react';
import { BenchmarkPageView } from '@/modules/benchmark';

export const metadata = {
  title: 'YOLO11n Edge Benchmark — DataForge AI',
  description: 'Đánh giá độ trễ suy luận OpenVINO INT8 và độ chính xác mAP thời gian thực',
};

export default function BenchmarkPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7F2]" />}>
      <BenchmarkPageView />
    </Suspense>
  );
}
