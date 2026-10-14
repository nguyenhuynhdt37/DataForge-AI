"use client";

import React from 'react';
import Link from 'next/link';
import { FolderKanban, Users, Clock, ArrowRight } from 'lucide-react';
import { SpotlightCard, ShinyText } from '@/shared/components/ui';
import { ProjectItem } from '../types';

interface ProjectCardProps {
  project: ProjectItem;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const statusColorClass = 
    project.statusColor || 
    project.status_color || 
    'bg-[#E8F0EA] text-[#2D5A34] border-[#CDE0D1]';

  const annotatedFramesText = project.annotatedFrames || project.annotated_frames || '0';
  const totalFramesText = project.totalFrames || project.total_frames || '10,000';
  const tasksCountNum = project.tasksCount || project.tasks_count || 1;
  const lastActiveText = project.lastActive || project.last_active || 'Vừa xong';

  return (
    <SpotlightCard 
      className="bg-white border border-[#E5E3DC] rounded-2xl p-6 shadow-soft-sm hover:shadow-soft transition-all flex flex-col justify-between"
      spotlightColor="rgba(183, 205, 187, 0.25)"
    >
      <div>
        {/* Header card */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-[#E8F0EA] border border-[#CDE0D1] flex items-center justify-center text-[#2D5A34]">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1F2627] font-editorial hover:text-[#2D5A34] transition-colors cursor-pointer">
                {project.title || project.name}
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-[#475254] mt-0.5">
                <span className="font-semibold text-[#1F2627]">{project.id}</span>
                <span>/</span>
                <span>{project.type}</span>
              </div>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColorClass}`}>
            {project.status}
          </span>
        </div>

        {project.description && (
          <p className="text-xs text-[#475254] mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Progress Bar Soft Editorial */}
        <div className="space-y-1.5 my-4">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-[#475254]">Tiến độ gán nhãn:</span>
            <span className="font-bold text-[#1F2627] font-mono">{project.progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#FAF9F5] border border-[#E5E3DC] overflow-hidden">
            <div 
              className="h-full rounded-full bg-[#7FA086] transition-all duration-500"
              style={{ width: `${Math.min(Math.max(project.progress, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Metrics Details */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E5E3DC] text-xs">
          <div>
            <div className="text-[11px] text-[#475254]">Khung hình</div>
            <div className="font-bold text-[#1F2627] font-mono mt-0.5">
              {annotatedFramesText} / {totalFramesText}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#475254]">Tasks / Jobs</div>
            <div className="font-bold text-[#1F2627] font-mono mt-0.5">
              {tasksCountNum} Tasks
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#475254]">Nhân sự</div>
            <div className="font-bold text-[#1F2627] font-mono mt-0.5 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-[#475254]" />
              <span>{project.annotators} người</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 flex items-center justify-between text-xs">
        <div className="text-[#475254] flex items-center gap-1.5 font-medium">
          <Clock className="h-3.5 w-3.5" />
          <span>Cập nhật {lastActiveText}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/hitl-studio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F0EA] hover:bg-[#d8e8dc] text-[#2D5A34] font-bold transition-all active:scale-[0.98]"
          >
            <span>Mở HITL Studio</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </SpotlightCard>
  );
};
