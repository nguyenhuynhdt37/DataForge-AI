"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, 
  Layers, 
  Target, 
  ShieldCheck, 
  Cpu, 
  FolderKanban, 
  BarChart3,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Database,
  ExternalLink,
  KeyRound
} from 'lucide-react';
import { 
  SplitText, 
  BlurText, 
  SpotlightCard, 
  Squares,
  AnimatedContent,
  DecryptedText
} from '@/shared/components/react-bits';
import { AppHeader } from '@/shared/components/layout';
import { OnboardingModal, useOnboarding } from '@/modules/onboarding';

export default function LandingOverviewPage() {
  const {
    isOpen,
    openModal,
    handleDismiss,
    currentUser,
    isAlreadyConnected,
  } = useOnboarding();

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#303A3B] flex flex-col relative overflow-hidden font-sans selection:bg-[#DCEBE0]">
      
      {/* React Bits Squares Subtle Canvas Background */}
      <Squares 
        direction="diagonal" 
        speed={0.2} 
        squareSize={56} 
        borderColor="#ECEAE2" 
        hoverFillColor="#E2EFE5" 
      />

      {/* 3-Zone Soft Editorial Tech AppHeader */}
      <AppHeader />

      {/* Main Content Container */}
      <main className="relative flex-1 max-w-[1340px] mx-auto w-full px-6 py-12 md:py-16 z-10 space-y-20">
        
        {/* ============================================================== */}
        {/* 1. HERO SECTION: SOFT EDITORIAL HEADLINE                       */}
        {/* ============================================================== */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F0EA] border border-[#D5E4D8] text-[#303A3B] text-xs font-semibold tracking-wide">
            <Target className="h-3.5 w-3.5 text-[#5C8564]" />
            <span>DATA-CENTRIC PLATFORM — CHIẾN DỊCH GÁN NHÃN THỊ GIÁC XE ĐIỆN</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#303A3B] leading-[1.15] font-editorial">
            <SplitText 
              text="Kiến tạo Dữ liệu Tinh tuyển," 
              className="block"
              delay={25}
            />
            <span className="text-[#4E7756] block mt-1">
              <SplitText 
                text="Cho Mô hình AI Bền vững." 
                delay={35}
              />
            </span>
          </h1>

          <div className="max-w-2xl mx-auto text-base text-[#6B7677] leading-relaxed">
            <BlurText 
              text="Hợp nhất Active Learning, kiểm định Human-in-the-Loop và tối ưu hóa suy luận OpenVINO INT8 thành một luồng công việc liền mạch, nhân văn và chuẩn mực."
              delay={25}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#B7CDBB] hover:bg-[#a6c2ac] px-6 py-3.5 text-sm font-bold text-[#303A3B] shadow-soft hover:shadow-soft-lg active:scale-[0.98] transition-all"
            >
              <span>Khám phá Dự án Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/active-mining"
              className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-[#F2F1EB] border border-[#E5E3DC] px-5 py-3.5 text-sm font-semibold text-[#303A3B] shadow-soft-sm transition-all"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#6B7677]" />
              <span>Trực quan hóa Active Mining</span>
            </Link>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 1.5. FIRST-LOGIN ONBOARDING & CVAT HOST SETUP SHOWCASE         */}
        {/* ============================================================== */}
        <AnimatedContent distance={16} duration={0.3} className="max-w-4xl mx-auto w-full">
          <SpotlightCard 
            className="bg-[#FAF9F5] border border-[#ECEAE2] p-6 sm:p-8 rounded-3xl shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden" 
            spotlightColor="rgba(183, 205, 187, 0.28)"
          >
            {/* Cột Trái: Thông tin thiết lập ban đầu */}
            <div className="space-y-3 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0EA] border border-[#CDE0D1] text-[#2D5A34] text-xs font-mono font-bold uppercase tracking-wider">
                  <Database className="h-3 w-3" />
                  <span>ONBOARDING & TÍCH HỢP HỆ THỐNG</span>
                </span>
                
                {isAlreadyConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#E8F0EA] border border-[#CDE0D1] text-[#2D5A34] text-xs font-mono font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A34] animate-pulse" />
                    <span>CVAT: @</span>
                    <DecryptedText text={currentUser?.cvat_username || 'connected'} speed={35} className="font-bold underline" />
                    <span className="opacity-75">#{currentUser?.cvat_user_id}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FAF2E8] border border-[#EEDFCD] text-[#8C6239] text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8C6239] animate-pulse" />
                    Chưa liên kết kho gán nhãn
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2627] font-editorial">
                {isAlreadyConnected 
                  ? "Kho Gán nhãn CVAT Host Đang Hoạt Động" 
                  : "Tùy chọn Khởi tạo Không gian & Kho Gán nhãn CVAT"}
              </h2>

              <p className="text-xs sm:text-sm text-[#5A6466] leading-relaxed max-w-xl">
                {isAlreadyConnected 
                  ? "Tài khoản của bạn đã được kết nối trực tiếp với máy chủ cvat.itup.io.vn. Tác vụ kiểm duyệt và dữ liệu bounding box sẽ được đồng bộ hóa tự động."
                  : "Liên kết tài khoản dán nhãn tập trung trên máy chủ CVAT (cvat.itup.io.vn) để tải bộ dữ liệu, phân quyền kiểm duyệt và đánh giá chất lượng mô hình YOLO."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#5A6466] font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2D5A34]" />
                  <span>Xác thực Username/Pass hoặc PAT Token</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2D5A34]" />
                  <span>Tự động lưu trạng thái vào CSDL</span>
                </div>
              </div>
            </div>

            {/* Cột Phải: Nút mở Modal tương tác */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={openModal}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#2D5A34] hover:bg-[#234629] text-white text-xs font-bold shadow-soft hover:shadow-soft-lg active:scale-[0.98] transition-all cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isAlreadyConnected ? "Quản lý Liên kết CVAT" : "Mở Thiết lập Onboarding"}</span>
              </button>

              {isAlreadyConnected ? (
                <a
                  href="https://cvat.itup.io.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F2EFE9] border border-[#ECEAE2] text-xs font-semibold text-[#1F2627] transition-all"
                >
                  <span>Mở cvat.itup.io.vn</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#5A6466]" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={openModal}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F2EFE9] border border-[#ECEAE2] text-xs font-semibold text-[#5A6466] hover:text-[#1F2627] transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#5A6466]" />
                  <span>Thử nghiệm Form CVAT</span>
                </button>
              )}
            </div>
          </SpotlightCard>
        </AnimatedContent>

        {/* ============================================================== */}
        {/* 2. PIPELINE WORKFLOW (4 GIAI ĐOẠN KHÉP KÍN)                    */}
        {/* ============================================================== */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 border-b border-[#E5E3DC] pb-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7677]">
                WORKFLOW KIẾN TRÚC
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#303A3B] font-editorial mt-1">
                Chu trình Khép kín Data-Centric MLOps
              </h2>
            </div>
            <p className="text-xs text-[#6B7677] max-w-md">
              Tối ưu hóa dữ liệu gán nhãn trước khi đưa vào huấn luyện mô hình nhận diện xe điện thông minh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stage 1 */}
            <SpotlightCard className="bg-white border border-[#E5E3DC] p-6 rounded-2xl shadow-soft-sm flex flex-col justify-between h-56" spotlightColor="rgba(183, 205, 187, 0.25)">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold text-[#6B7677]">01 / GIAI ĐOẠN</span>
                  <div className="h-8 w-8 rounded-lg bg-[#EBF3ED] flex items-center justify-center text-[#4E7756]">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#303A3B] font-editorial">
                  Data Curation & Lab
                </h3>
                <p className="text-xs text-[#6B7677] mt-2 leading-relaxed">
                  Thu thập khung hình camera hành trình xe điện, kiểm tra phân phối nhãn và lọc trùng lặp.
                </p>
              </div>
              <Link href="/data-lab" className="text-xs font-bold text-[#4E7756] hover:underline flex items-center gap-1">
                Xem Data Lab <ArrowRight className="h-3 w-3" />
              </Link>
            </SpotlightCard>

            {/* Stage 2 */}
            <SpotlightCard className="bg-white border border-[#E5E3DC] p-6 rounded-2xl shadow-soft-sm flex flex-col justify-between h-56" spotlightColor="rgba(198, 217, 232, 0.3)">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold text-[#6B7677]">02 / GIAI ĐOẠN</span>
                  <div className="h-8 w-8 rounded-lg bg-[#E6F0F7] flex items-center justify-center text-[#3D6B8C]">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#303A3B] font-editorial">
                  Active Mining k-Center
                </h3>
                <p className="text-xs text-[#6B7677] mt-2 leading-relaxed">
                  Thuật toán trích xuất các mẫu ca khó (hard slices) dựa trên 2D PCA Embeddings và độ bất định.
                </p>
              </div>
              <Link href="/active-mining" className="text-xs font-bold text-[#3D6B8C] hover:underline flex items-center gap-1">
                Mở Visualizer <ArrowRight className="h-3 w-3" />
              </Link>
            </SpotlightCard>

            {/* Stage 3 */}
            <SpotlightCard className="bg-white border border-[#E5E3DC] p-6 rounded-2xl shadow-soft-sm flex flex-col justify-between h-56" spotlightColor="rgba(220, 214, 232, 0.3)">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold text-[#6B7677]">03 / GIAI ĐOẠN</span>
                  <div className="h-8 w-8 rounded-lg bg-[#EFEBF5] flex items-center justify-center text-[#5C4D78]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#303A3B] font-editorial">
                  HITL Consensus Studio
                </h3>
                <p className="text-xs text-[#6B7677] mt-2 leading-relaxed">
                  Quy trình gán nhãn chuyên nghiệp với Reviewer & Annotator độc lập, kiểm tra IoU đồng thuận.
                </p>
              </div>
              <Link href="/hitl-studio" className="text-xs font-bold text-[#5C4D78] hover:underline flex items-center gap-1">
                Vào Studio <ArrowRight className="h-3 w-3" />
              </Link>
            </SpotlightCard>

            {/* Stage 4 */}
            <SpotlightCard className="bg-white border border-[#E5E3DC] p-6 rounded-2xl shadow-soft-sm flex flex-col justify-between h-56" spotlightColor="rgba(220, 235, 224, 0.3)">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold text-[#6B7677]">04 / GIAI ĐOẠN</span>
                  <div className="h-8 w-8 rounded-lg bg-[#EAF5EC] flex items-center justify-center text-[#3D7847]">
                    <Cpu className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#303A3B] font-editorial">
                  YOLO11n Edge Benchmark
                </h3>
                <p className="text-xs text-[#6B7677] mt-2 leading-relaxed">
                  Đánh giá độ trễ suy luận OpenVINO INT8 4.2ms và độ chính xác mAP@50 trước khi triển khai đội xe.
                </p>
              </div>
              <Link href="/benchmark" className="text-xs font-bold text-[#3D7847] hover:underline flex items-center gap-1">
                Xem Báo cáo <ArrowRight className="h-3 w-3" />
              </Link>
            </SpotlightCard>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. BENTO SHOWCASE: LIVE METRICS & COMMERCIAL PREVIEW           */}
        {/* ============================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Card Lớn: Ảnh xe điện ban ngày */}
          <SpotlightCard className="lg:col-span-7 bg-white border border-[#E5E3DC] p-0 rounded-2xl shadow-soft overflow-hidden flex flex-col justify-between" spotlightColor="rgba(183, 205, 187, 0.2)">
            <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-100">
              <Image
                src="/images/greensm-daylight.jpg"
                alt="Telemetry Camera Feed"
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#303A3B]/70 via-transparent to-transparent" />
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-[#E5E3DC] text-xs font-mono font-semibold text-[#303A3B]">
                TELEMETRY FEED — CAMERA HÀNH TRÌNH ĐÔ THỊ
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow flex justify-between items-end">
                <div>
                  <div className="text-xs uppercase font-mono tracking-wider opacity-80">Môi trường thực địa</div>
                  <div className="text-lg font-bold font-editorial">Hành lang Đô thị Thông minh</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#B7CDBB] text-[#303A3B] font-bold text-xs">
                  60 FPS LIVE
                </span>
              </div>
            </div>
            <div className="p-6 bg-white border-t border-[#E5E3DC]">
              <div className="text-xs font-mono font-bold text-[#4E7756] uppercase tracking-wider mb-1">
                TRIẾT LÝ SẢN PHẨM
              </div>
              <h4 className="text-lg font-bold text-[#303A3B] font-editorial">
                Chất lượng Dữ liệu quan trọng hơn Số lượng Dữ liệu
              </h4>
              <p className="text-xs text-[#6B7677] mt-2 leading-relaxed">
                Thay vì gán nhãn hàng trăm nghìn ảnh vô nghĩa, DataForge AI tập trung phát hiện các phân đoạn bất định và ca khó hiểm hóc để đào tạo mô hình đạt độ nhạy bén cao nhất trên từng km đường phố Việt Nam.
              </p>
            </div>
          </SpotlightCard>

          {/* Cột Nhỏ: 3 Chỉ số quan trọng */}
          <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
            
            <SpotlightCard className="bg-white border border-[#E5E3DC] p-6 rounded-2xl shadow-soft-sm flex-1 flex flex-col justify-center" spotlightColor="rgba(198, 217, 232, 0.3)">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#6B7677] uppercase">Tốc độ suy luận Edge</div>
                  <div className="text-3xl font-extrabold text-[#303A3B] font-editorial mt-1">4.2 ms</div>
                  <div className="text-xs text-[#4E7756] font-medium mt-1">Chuẩn INT8 OpenVINO trên CPU nhúng</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#E6F0F7] text-[#3D6B8C]">
                  <Cpu className="h-5 w-5" />
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="bg-white border border-[#E5E3DC] p-6 rounded-2xl shadow-soft-sm flex-1 flex flex-col justify-center" spotlightColor="rgba(183, 205, 187, 0.3)">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#6B7677] uppercase">Độ đồng thuận QA/QC</div>
                  <div className="text-3xl font-extrabold text-[#303A3B] font-editorial mt-1">84.2%</div>
                  <div className="text-xs text-[#4E7756] font-medium mt-1">IoU Bounding Box giữa 2 cấp kiểm duyệt</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#EBF3ED] text-[#4E7756]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard className="bg-white border border-[#E5E3DC] p-6 rounded-2xl shadow-soft-sm flex-1 flex flex-col justify-center" spotlightColor="rgba(220, 214, 232, 0.3)">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#6B7677] uppercase">Khung hình Đã tinh tuyển</div>
                  <div className="text-3xl font-extrabold text-[#303A3B] font-editorial mt-1">1.48M</div>
                  <div className="text-xs text-[#6B7677] font-medium mt-1">Tiết kiệm 65% chi phí gán nhãn thủ công</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#EFEBF5] text-[#5C4D78]">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </SpotlightCard>

          </div>
        </section>

      </main>

      {/* Footer Soft Editorial */}
      <footer className="border-t border-[#E5E3DC] bg-white py-10 px-6 md:px-12 mt-12">
        <div className="max-w-[1340px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#6B7677]">
          <div className="flex items-center gap-3">
            <div className="relative h-6 w-6 rounded-md overflow-hidden border border-[#E5E3DC]">
              <Image src="/logo.png" alt="DataForge Logo" fill className="object-contain" />
            </div>
            <span className="font-bold text-[#303A3B]">DataForge AI Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/projects" className="hover:text-[#303A3B] transition-colors">Workspace</Link>
            <Link href="/active-mining" className="hover:text-[#303A3B] transition-colors">Active Mining</Link>
            <Link href="/hitl-studio" className="hover:text-[#303A3B] transition-colors">HITL Studio</Link>
            <Link href="/login" className="hover:text-[#303A3B] transition-colors">Đăng nhập</Link>
          </div>

          <div>
            © 2026 DataForge AI
          </div>
        </div>
      </footer>

      {/* Modal Onboarding & Kết Nối CVAT Host từ Domain Module onboarding */}
      <OnboardingModal
        isOpen={isOpen}
        onClose={handleDismiss}
        currentUser={currentUser}
        isDark={false}
      />

    </div>
  );
}
