"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  X,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';
import { 
  SplitText, 
  Squares,
  Button
} from '@/shared/components/ui';
import { projectsApi } from '../services/projectsApi';
import { ProjectItem, CreateProjectPayload, CampaignType } from '../types';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { AppHeader } from '@/shared/components/layout';

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "PRJ-GSM-01",
    name: "GreenSM Vehicle Detection",
    title: "GreenSM Vehicle Detection",
    description: "Chiến dịch nhận diện và phân loại phương tiện ô tô điện GreenSM",
    type: "Active Learning V3",
    status: "Đang gán nhãn",
    statusColor: "bg-[#E8F0EA] text-[#2D5A34] border-[#CDE0D1]",
    status_color: "bg-[#E8F0EA] text-[#2D5A34] border-[#CDE0D1]",
    progress: 68,
    totalFrames: "45,200",
    total_frames: "45,200",
    annotatedFrames: "30,736",
    annotated_frames: "30,736",
    annotators: 8,
    lead: "Data Lead",
    lastActive: "10 phút trước",
    last_active: "10 phút trước",
    tasksCount: 4,
    tasks_count: 4,
  },
  {
    id: "PRJ-GSM-02",
    name: "Pedestrian Trajectory & Safety",
    title: "Pedestrian Trajectory & Safety",
    description: "Giám định quỹ đạo người đi bộ và biển báo an toàn đô thị",
    type: "Hard Slice Curation",
    status: "Kiểm duyệt QA/QC",
    statusColor: "bg-[#E6F0F7] text-[#2A5778] border-[#C6D9E8]",
    status_color: "bg-[#E6F0F7] text-[#2A5778] border-[#C6D9E8]",
    progress: 84,
    totalFrames: "28,100",
    total_frames: "28,100",
    annotatedFrames: "23,604",
    annotated_frames: "23,604",
    annotators: 5,
    lead: "QA Lead Huỳnh",
    lastActive: "2 giờ trước",
    last_active: "2 giờ trước",
    tasksCount: 3,
    tasks_count: 3,
  },
  {
    id: "PRJ-GSM-03",
    name: "Traffic Signs & Signals Realtime",
    title: "Traffic Signs & Signals Realtime",
    description: "Đo lường độ trễ và độ chính xác nhận diện biển báo trên thiết bị biên",
    type: "Edge INT8 Benchmark",
    status: "Đã hoàn thành",
    statusColor: "bg-[#EFEBF5] text-[#55476E] border-[#DFD8EB]",
    status_color: "bg-[#EFEBF5] text-[#55476E] border-[#DFD8EB]",
    progress: 100,
    totalFrames: "18,400",
    total_frames: "18,400",
    annotatedFrames: "18,400",
    annotated_frames: "18,400",
    annotators: 4,
    lead: "YOLO Specialist",
    lastActive: "Hôm qua",
    last_active: "Hôm qua",
    tasksCount: 2,
    tasks_count: 2,
  },
  {
    id: "PRJ-GSM-04",
    name: "Weather Anomaly (Rain & Night Fog)",
    title: "Weather Anomaly (Rain & Night Fog)",
    description: "Khai phá ca khó trong điều kiện mưa đêm và chói sáng đèn pha",
    type: "Zero-Shot Discovery",
    status: "Khởi tạo",
    statusColor: "bg-[#FAF2E8] text-[#8C6239] border-[#EEDFCD]",
    status_color: "bg-[#FAF2E8] text-[#8C6239] border-[#EEDFCD]",
    progress: 25,
    totalFrames: "12,000",
    total_frames: "12,000",
    annotatedFrames: "3,000",
    annotated_frames: "3,000",
    annotators: 3,
    lead: "Data Curator",
    lastActive: "3 ngày trước",
    last_active: "3 ngày trước",
    tasksCount: 2,
    tasks_count: 2,
  }
];

export const ProjectsPageView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialName, setModalInitialName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Tải danh sách dự án từ backend API thông qua module projectsApi
  useEffect(() => {
    let isMounted = true;

    async function fetchProjects() {
      try {
        const res = await projectsApi.getProjects();
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setProjectsList(res.data);
        }
      } catch (err: unknown) {
        console.warn("Sử dụng dữ liệu dự án ban đầu do chưa thể kết nối API:", err);
      }
    }

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  // 1-Click Quick Create: Tạo nhanh dự án mẫu & gọi API POST /projects
  const handleQuickCreateProject = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const rand = Math.floor(Math.random() * 900) + 100;
    const campaignTypes: CampaignType[] = [
      'Active Learning V3', 
      'Hard Slice Curation', 
      'Edge INT8 Benchmark', 
      'Zero-Shot Discovery'
    ];
    const chosenType = campaignTypes[Math.floor(Math.random() * campaignTypes.length)];
    const generatedName = `Chiến dịch Dữ liệu #${rand}`;

    try {
      console.log('🚀 [FE CALL API QUICK PROJECT] POST /api/v1/projects', { name: generatedName });
      const res = await projectsApi.createProject({
        name: generatedName,
        description: `Tự động phân bổ ca khó thời tiết & góc khuất camera hành trình (Mã tạo: ${rand})`,
        campaign_type: chosenType,
      });

      const createdItem = res.data;
      setProjectsList((prev) => [createdItem, ...prev]);
      setSuccessToast(`Đã gọi API & tạo thành công dự án ${createdItem.id}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: unknown) {
      console.error('❌ [FE API QUICK PROJECT ERROR]:', err);
      const errMsg = err instanceof Error ? err.message : 'Không thể tạo nhanh dự án.';
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Xử lý submit từ Modal tạo mới dự án
  const handleModalSubmit = useCallback(async (payload: CreateProjectPayload) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('🚀 [FE CALL API CREATE PROJECT] POST /api/v1/projects', payload);
      const res = await projectsApi.createProject(payload);

      const createdItem = res.data;
      setProjectsList((prev) => [createdItem, ...prev]);
      setIsModalOpen(false);

      setSuccessToast(`Đã gọi API & tạo thành công dự án ${createdItem.id}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: unknown) {
      console.error('❌ [FE API CREATE PROJECT ERROR]:', err);
      const errMsg = err instanceof Error ? err.message : 'Không thể tạo mới dự án. Vui lòng thử lại.';
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const openCreateModal = useCallback(() => {
    setSubmitError(null);
    setModalInitialName(`Chiến dịch Dữ liệu #${projectsList.length + 1}`);
    setIsModalOpen(true);
  }, [projectsList.length]);

  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return projectsList;
    return projectsList.filter((p) => {
      const matchName = (p.title || p.name || '').toLowerCase().includes(q);
      const matchId = (p.id || '').toLowerCase().includes(q);
      const matchType = (p.type || '').toLowerCase().includes(q);
      return matchName || matchId || matchType;
    });
  }, [projectsList, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1F2627] flex flex-col relative overflow-hidden font-sans selection:bg-[#DCEBE0]">
      {/* Background Subtle Squares */}
      <Squares 
        direction="diagonal" 
        speed={0.15} 
        squareSize={56} 
        borderColor="#ECEAE2" 
        hoverFillColor="#E2EFE5" 
      />

      {/* 3-Zone Soft Editorial Tech AppHeader */}
      <AppHeader
        customActions={
          <Link 
            href="/hitl-studio" 
            className="text-xs font-semibold text-[#2D5A34] hover:underline px-2 py-1"
          >
            Mở HITL Studio
          </Link>
        }
      />

      {/* Main Content */}
      <main className="relative flex-1 max-w-[1340px] mx-auto w-full px-6 py-10 z-10 space-y-8">
        
        {/* Success Toast */}
        {successToast && (
          <div className="p-4 rounded-xl bg-[#E8F0EA] border border-[#CDE0D1] flex items-center justify-between text-xs text-[#2D5A34] font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successToast}</span>
            </div>
            <button 
              type="button"
              onClick={() => setSuccessToast(null)} 
              className="text-[#2D5A34] hover:opacity-70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Title & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#E5E3DC]">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#2D5A34]">
              QUẢN TRỊ DỰ ÁN & TIẾN ĐỘ
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1F2627] font-editorial mt-1">
              <SplitText text="Dự án Gán nhãn & Kiểm thử Dữ liệu" delay={20} />
            </h1>
            <p className="text-xs text-[#475254] mt-1">
              Điều phối các chiến dịch Active Learning, phân bổ Task và đồng thuận QA/QC hai cấp độ.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#475254]" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm dự án, mã chiến dịch..." 
                className="w-full bg-white border border-[#D5D2C8] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1F2627] placeholder:text-[#5A6466]/60 focus:outline-none focus:border-[#7FA086] focus:ring-4 focus:ring-[#7FA086]/20 shadow-soft-sm font-sans"
              />
            </div>

            {/* Nút 1-Click: Tạo nhanh dự án mẫu & GỌI NGAY API POST /api/v1/projects */}
            <Button
              variant="secondary"
              size="md"
              onClick={handleQuickCreateProject}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              icon={<Plus className="h-4 w-4" />}
            >
              ⚡ Tạo Nhanh Dự Án (1-Click API)
            </Button>

            {/* Nút Tạo Dự Án Mới - Mở Modal */}
            <Button
              variant="primary"
              size="md"
              onClick={openCreateModal}
              icon={<Plus className="h-4 w-4" />}
            >
              Tạo Dự án Mới
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#E5E3DC] rounded-2xl">
            <FolderKanban className="h-12 w-12 text-[#7FA086] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[#1F2627] font-editorial">
              Không tìm thấy dự án phù hợp
            </h3>
            <p className="text-xs text-[#475254] mt-1">
              Thử tìm kiếm với từ khóa khác hoặc nhấn &quot;Tạo nhanh dự án&quot; để thêm mới.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>

      {/* Modal tạo dự án mới */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        initialName={modalInitialName}
      />
    </div>
  );
};
