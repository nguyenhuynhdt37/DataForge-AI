"use client";

import React from 'react';
import Link from 'next/link';
import { Layers, Target, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export const PipelineStepper: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Data Curation & Lab',
      desc: 'Phân tích phân phối dữ liệu, phát hiện trùng lặp & lọc lát cắt ca khó.',
      href: '/data-lab',
      icon: Layers,
      color: 'text-[#2D5A34] bg-[#E8F0EA] border-[#CDE0D1]',
    },
    {
      number: '02',
      title: 'Active Mining k-Center',
      desc: 'Trích xuất ca khó dựa trên 2D PCA Embeddings và độ bất định mô hình.',
      href: '/active-mining',
      icon: Target,
      color: 'text-[#2A5778] bg-[#E6F0F7] border-[#C6D9E8]',
    },
    {
      number: '03',
      title: 'HITL Consensus Studio',
      desc: 'Gán nhãn chuyên nghiệp, đối soát IoU hai cấp & hỗ trợ trợ lý SOP RAG.',
      href: '/hitl-studio',
      icon: ShieldCheck,
      color: 'text-[#55476E] bg-[#EFEBF5] border-[#DFD8EB]',
    },
    {
      number: '04',
      title: 'YOLO11n Edge Benchmark',
      desc: 'Kiểm định độ trễ suy luận OpenVINO INT8 4.2ms trước khi triển khai thực địa.',
      href: '/benchmark',
      icon: Cpu,
      color: 'text-[#3D7847] bg-[#EAF5EC] border-[#CEE5D1]',
    },
  ];

  return (
    <div className="bg-white border border-[#E5E3DC] rounded-2xl p-6 shadow-soft-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#ECEAE2] pb-4">
        <div>
          <h3 className="text-base font-bold text-[#1F2627] font-editorial">
            Chu Trình Khép Kín DataForge MLOps
          </h3>
          <p className="text-xs text-[#5A6466] mt-0.5">
            4 giai đoạn tối ưu hóa chất lượng dữ liệu và kiểm định mô hình nhận diện xe điện.
          </p>
        </div>
        <span className="text-[11px] font-mono font-semibold text-[#2D5A34] px-3 py-1 rounded-full bg-[#E8F0EA] border border-[#CDE0D1]">
          Continuous Data Flywheel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.number}
              href={step.href}
              className="group p-4 rounded-xl border border-[#ECEAE2] hover:border-[#7FA086] hover:bg-[#FAF9F5] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-[#5A6466]">
                    {step.number} / BƯỚC
                  </span>
                  <div className={`p-2 rounded-lg border ${step.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-[#1F2627] font-editorial group-hover:text-[#2D5A34] transition-colors">
                  {step.title}
                </h4>
                <p className="text-xs text-[#5A6466] mt-1.5 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-[#ECEAE2] flex items-center justify-between text-xs font-semibold text-[#2D5A34]">
                <span>Truy cập</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
