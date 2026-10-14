"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, Check, FolderKanban, Search, Plus, ExternalLink } from 'lucide-react';
import { projectsApi } from '@/modules/projects/services/projectsApi';
import { ProjectItem } from '@/modules/projects/types';
import { AnimatedContent } from '@/shared/components/react-bits';

const FALLBACK_PROJECTS: ProjectItem[] = [
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

export interface ProjectSelectorDropdownProps {
  currentProjectId?: string;
  onSelectProject?: (project: ProjectItem) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

const STORAGE_KEY = 'dataforge_active_project_id';

export const ProjectSelectorDropdown: React.FC<ProjectSelectorDropdownProps> = ({
  currentProjectId,
  onSelectProject,
  variant = 'light',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>(FALLBACK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    currentProjectId || FALLBACK_PROJECTS[0].id
  );
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Khôi phục ID dự án đã lưu từ localStorage nếu không truyền qua prop
  useEffect(() => {
    if (currentProjectId) {
      setSelectedProjectId(currentProjectId);
      return;
    }
    if (typeof window !== 'undefined') {
      const savedId = window.localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        setSelectedProjectId(savedId);
      }
    }
  }, [currentProjectId]);

  // Tải danh sách dự án từ API backend
  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const res = await projectsApi.getProjects();
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setProjects(res.data);
        }
      } catch (err: unknown) {
        // Fallback an toàn sang dữ liệu mặc định đã chuẩn bị
      }
    }
    loadProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  // Đóng dropdown khi click outside hoặc ấn phím Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || FALLBACK_PROJECTS[0];
  }, [projects, selectedProjectId]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        (p.name || p.title || '').toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const handleSelect = useCallback(
    (project: ProjectItem) => {
      setSelectedProjectId(project.id);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, project.id);
      }
      setIsOpen(false);
      setSearchQuery('');
      if (onSelectProject) {
        onSelectProject(project);
      }
    },
    [onSelectProject]
  );

  const isDark = variant === 'dark';

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Nút Kích Hoạt Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Chọn chiến dịch MLOps"
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
          isDark
            ? 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border-zinc-800 hover:border-zinc-700 shadow-sm'
            : 'bg-white hover:bg-[#F8F7F2] text-[#303A3B] border-[#E5E3DC] hover:border-[#B7CDBB] shadow-soft-sm'
        }`}
      >
        <div
          className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
            isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#E8F0EA] text-[#2D5A34]'
          }`}
        >
          <FolderKanban className="h-3 w-3" />
        </div>

        <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-[260px] truncate text-left">
          <span className="font-mono font-bold tracking-tight text-[11px] shrink-0">
            {activeProject.id}
          </span>
          <span className={isDark ? 'text-zinc-600' : 'text-[#C5C3BC]'}>:</span>
          <span className="truncate font-editorial font-medium">
            {activeProject.title || activeProject.name}
          </span>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          } ${isDark ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-[#6B7677] group-hover:text-[#303A3B]'}`}
        />
      </button>

      {/* Popover Dropdown Danh Sách Dự Án */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-xl z-50 overflow-hidden ${
            isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-black/60'
              : 'bg-white border-[#E5E3DC] text-[#303A3B] shadow-soft-lg'
          }`}
        >
          <AnimatedContent distance={8} duration={0.2}>
            {/* Header Trong Popover */}
            <div
              className={`p-3 border-b flex items-center justify-between ${
                isDark ? 'border-zinc-800 bg-zinc-900/60' : 'border-[#E5E3DC] bg-[#FAF9F5]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2D5A34]">
                  CHIẾN DỊCH HOẠT ĐỘNG
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-[#E5E3DC] text-[#6B7677]'
                  }`}
                >
                  {projects.length}
                </span>
              </div>

              <Link
                href="/projects"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-1 text-[11px] font-medium hover:underline ${
                  isDark ? 'text-emerald-400' : 'text-[#2D5A34]'
                }`}
              >
                <span>Xem tất cả</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Ô Tìm Kiếm Nhanh */}
            <div className={`p-2.5 border-b ${isDark ? 'border-zinc-800' : 'border-[#E5E3DC]'}`}>
              <div className="relative">
                <Search
                  className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${
                    isDark ? 'text-zinc-500' : 'text-[#6B7677]'
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lọc mã PRJ hoặc tên chiến dịch..."
                  className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50'
                      : 'bg-[#F8F7F2] border border-[#E5E3DC] text-[#303A3B] placeholder:text-[#6B7677]/60 focus:border-[#B7CDBB]'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {/* Danh Sách Dự Án */}
            <div className="max-h-72 overflow-y-auto divide-y divide-transparent p-1.5 space-y-1">
              {filteredProjects.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#6B7677]">
                  Không tìm thấy chiến dịch phù hợp với từ khóa.
                </div>
              ) : (
                filteredProjects.map((p) => {
                  const isSelected = p.id === activeProject.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelect(p)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                            : 'bg-[#E8F0EA] border border-[#CDE0D1] text-[#1F2627]'
                          : isDark
                          ? 'hover:bg-zinc-900 border border-transparent text-zinc-300 hover:text-white'
                          : 'hover:bg-[#F8F7F2] border border-transparent text-[#303A3B]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[11px] font-bold shrink-0">
                            {p.id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full font-medium shrink-0 ${
                              isDark
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-white border border-[#E5E3DC] text-[#6B7677]'
                            }`}
                          >
                            {p.type}
                          </span>
                        </div>
                        <div className="text-xs font-semibold truncate font-editorial">
                          {p.title || p.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                          <span
                            className={`font-mono ${
                              isDark ? 'text-zinc-500' : 'text-[#6B7677]'
                            }`}
                          >
                            Tiến độ: {p.progress}%
                          </span>
                          <span
                            className={`h-1 flex-1 rounded-full overflow-hidden ${
                              isDark ? 'bg-zinc-800' : 'bg-[#E5E3DC]'
                            }`}
                          >
                            <span
                              className="block h-full bg-[#7FA086] rounded-full"
                              style={{ width: `${p.progress}%` }}
                            />
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                            isDark
                              ? 'bg-emerald-500 text-zinc-950'
                              : 'bg-[#2D5A34] text-white'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Popover: Chuyển Nhanh Sang Tạo Dự Án */}
            <div
              className={`p-2.5 border-t text-center ${
                isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-[#E5E3DC] bg-[#FAF9F5]'
              }`}
            >
              <Link
                href="/projects"
                onClick={() => setIsOpen(false)}
                className={`inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    : 'bg-white hover:bg-[#F2F1EB] border border-[#E5E3DC] text-[#303A3B]'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Khởi tạo Chiến dịch Mới</span>
              </Link>
            </div>
          </AnimatedContent>
        </div>
      )}
    </div>
  );
};
