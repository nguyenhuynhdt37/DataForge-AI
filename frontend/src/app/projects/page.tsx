import { Suspense } from 'react';
import { ProjectsPageView } from '@/modules/projects';

export const metadata = {
  title: 'Dự án Workspace — DataForge AI',
  description: 'Quản trị dự án dữ liệu, kiểm thử và pipeline Active Learning',
};

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F7F2]" />}>
      <ProjectsPageView />
    </Suspense>
  );
}
