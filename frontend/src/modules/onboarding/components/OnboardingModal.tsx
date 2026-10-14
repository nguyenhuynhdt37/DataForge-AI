"use client";

import React, { useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  UserCheck, 
  Database,
  ShieldCheck,
  Layers,
  Server,
  Loader2
} from 'lucide-react';
import { 
  AnimatedContent, 
  SplitText, 
  BlurText, 
  SpotlightCard, 
  DecryptedText 
} from '@/shared/components/react-bits';
import { OnboardingTab, OnboardingModalProps } from '../types';
import { CvatLoginForm } from './CvatLoginForm';
import { CvatTokenForm } from './CvatTokenForm';
import { CvatConnectedView } from './CvatConnectedView';
import { useOnboarding } from '../hooks/useOnboarding';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  currentUser: propUser,
  isDark = false,
}) => {
  const {
    isOpen: hookIsOpen,
    activeTab,
    loading,
    errorMessage,
    successMessage,
    currentUser: hookUser,
    isAlreadyConnected,
    setActiveTab,
    handleDismiss,
    handleLoginWithCredentials,
    handleConnectWithToken,
    handleDisconnect,
    clearMessage,
  } = useOnboarding();

  const isOpen = propIsOpen !== undefined ? propIsOpen : hookIsOpen;
  const user = propUser || hookUser;

  // Lắng nghe phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (propOnClose) {
          propOnClose();
        } else {
          handleDismiss();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, propOnClose, handleDismiss]);

  if (!isOpen) return null;

  const handleModalClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      handleDismiss();
    }
  };

  const isFirstLogin = Boolean(user?.is_first_login);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-[#1F2627]/60 backdrop-blur-md animate-in fade-in duration-200">
      <AnimatedContent distance={18} duration={0.3} className="w-full max-w-4xl">
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full rounded-3xl bg-[#FDFCFA] border border-[#E5E3DC] text-[#1F2627] shadow-soft-lg overflow-hidden"
        >
          {/* Modal Header Soft Editorial */}
          <div className="flex items-start justify-between px-6 sm:px-8 py-5 border-b border-[#ECEAE2] bg-[#FAF9F5]">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1] shadow-soft-sm shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E8F0EA] text-[#2D5A34] border border-[#CDE0D1]">
                    {isFirstLogin ? "THIẾT LẬP LẦN ĐẦU" : "QUẢN LÝ KHO DỮ LIỆU"}
                  </span>
                  <span className="text-[11px] font-mono text-[#5A6466] hidden sm:inline">
                    ENTERPRISE VISION MLOPS
                  </span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F2627] font-editorial leading-tight">
                  {isAlreadyConnected ? (
                    "Quản lý Liên kết Kho Gán nhãn CVAT"
                  ) : (
                    <SplitText 
                      text="Liên kết Kho Dữ liệu Gán nhãn CVAT" 
                      delay={20}
                    />
                  )}
                </h2>

                <div className="text-xs text-[#5A6466] max-w-md leading-relaxed">
                  <BlurText
                    text="Kết nối máy chủ CVAT tập trung để nạp tập dữ liệu và đồng bộ hóa quy trình kiểm định thị giác."
                    delay={15}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              className="p-2 rounded-xl text-[#5A6466] hover:text-[#1F2627] hover:bg-[#EAE8E0] transition-colors cursor-pointer shrink-0"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Two-Column Soft Editorial Layout */}
          <div className="p-6 sm:p-8">
            
            {/* TRƯỜNG HỢP 1: ĂN MỪNG THÀNH CÔNG VỚI PHÁO HOA STUDYNEST */}
            {successMessage ? (
              <div className="py-10 px-4 sm:px-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-[#E8F0EA] border border-[#B7CDBB] flex items-center justify-center text-[#2D5A34] shadow-soft">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2D5A34]">
                    XÁC THỰC HOÀN TẤT
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold font-editorial text-[#1F2627]">
                    Liên kết Kho CVAT Thành công!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5A6466] leading-relaxed">
                    {successMessage}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF9F5] border border-[#ECEAE2] text-xs text-[#2D5A34] font-semibold pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2D5A34]" />
                  <span>Đang tự động chuyển bạn vào không gian làm việc...</span>
                </div>
              </div>
            ) : isAlreadyConnected && user ? (
              /* TRƯỜNG HỢP 2: ĐÃ LIÊN KẾT TÀI KHOẢN (Xem thông tin, mở kho, hủy liên kết) */
              <CvatConnectedView
                currentUser={user}
                onDisconnect={handleDisconnect}
                onClose={handleModalClose}
                loading={loading}
                isDark={false}
              />
            ) : (
              /* TRƯỜNG HỢP 3: FORM NHẬP LIỆU & BẢNG CHÚ THÍCH KỸ THUẬT SONG SONG */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                
                {/* CỘT TRÁI (7 CỘT): FORM NHẬP THÔNG TIN */}
                <div className="lg:col-span-7 space-y-5 text-left">
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#2D5A34]">
                      PHƯƠNG THỨC XÁC THỰC
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold font-editorial text-[#1F2627]">
                      Chọn phương thức đăng nhập
                    </h3>
                  </div>

                  {/* Tab Selector Pastel */}
                  <div className="flex p-1 rounded-2xl bg-[#F4F2EC] border border-[#ECEAE2]">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('credentials');
                        clearMessage();
                      }}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === 'credentials'
                          ? 'bg-white text-[#1F2627] shadow-soft-sm'
                          : 'text-[#5A6466] hover:text-[#1F2627]'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#2D5A34]" />
                      <span>Tài khoản CVAT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('token');
                        clearMessage();
                      }}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        activeTab === 'token'
                          ? 'bg-white text-[#1F2627] shadow-soft-sm'
                          : 'text-[#5A6466] hover:text-[#1F2627]'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#2D5A34]" />
                      <span>Token Cá nhân (PAT)</span>
                    </button>
                  </div>

                  {/* Backend Error Banner */}
                  {errorMessage && (
                    <div className="p-3.5 rounded-2xl text-xs flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 animate-in fade-in-50 duration-150">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <span className="font-semibold leading-relaxed">{errorMessage}</span>
                    </div>
                  )}

                  {/* Active Form Component */}
                  {activeTab === 'credentials' ? (
                    <CvatLoginForm
                      onSubmit={handleLoginWithCredentials}
                      onDismiss={handleModalClose}
                      loading={loading}
                      isDark={false}
                    />
                  ) : (
                    <CvatTokenForm
                      onSubmit={handleConnectWithToken}
                      onDismiss={handleModalClose}
                      loading={loading}
                      isDark={false}
                    />
                  )}
                </div>

                {/* CỘT PHẢI (5 CỘT): KHỐI CHÚ THÍCH KỸ THUẬT (SPOTLIGHT CARD REACT BITS) */}
                <div className="lg:col-span-5 text-left">
                  <SpotlightCard
                    className="rounded-3xl bg-[#FAF9F5] border border-[#ECEAE2] p-5 sm:p-6 space-y-4"
                    spotlightColor="rgba(183, 205, 187, 0.28)"
                  >
                    <div className="border-b border-[#ECEAE2] pb-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2D5A34]">
                        TÀI LIỆU KỸ THUẬT & QUY TRÌNH
                      </span>
                      <h4 className="text-base font-bold font-editorial text-[#1F2627] mt-0.5">
                        Mục đích & Chính sách Dữ liệu
                      </h4>
                    </div>

                    {/* 4 Chú thích cụ thể trả lời câu hỏi "Để làm gì?" */}
                    <div className="space-y-3.5 text-xs text-[#5A6466]">
                      <div className="space-y-1">
                        <div className="font-bold text-[#1F2627] flex items-center gap-1.5 text-xs">
                          <Layers className="w-3.5 h-3.5 text-[#2D5A34] shrink-0" />
                          <span>1. Đồng bộ Tác vụ Gán nhãn:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed pl-5 text-[#5A6466]">
                          Cấp quyền liên kết với máy chủ CVAT để nạp danh sách task, video hành trình và ảnh chụp xe điện GreenSM vào hệ thống.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-[#1F2627] flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A34] shrink-0" />
                          <span>2. Kiểm định HITL & IoU Bounding Box:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed pl-5 text-[#5A6466]">
                          Đồng bộ hóa kết quả gán nhãn giữa Reviewer và Annotator, tự động đo lường độ đồng thuận trước khi huấn luyện mô hình YOLO11n.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-[#1F2627] flex items-center gap-1.5 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A34] shrink-0" />
                          <span>3. Bảo mật Zero-Credential Storage:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed pl-5 text-[#5A6466]">
                          Mật khẩu chỉ gửi qua kết nối HTTPS/TLS để cấp Session Token và không bao giờ lưu trữ trong cơ sở dữ liệu GreenSM.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-[#1F2627] flex items-center gap-1.5 text-xs">
                          <Server className="w-3.5 h-3.5 text-[#2D5A34] shrink-0" />
                          <span>4. Lưu trạng thái vĩnh viễn:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed pl-5 text-[#5A6466]">
                          Sau khi hoàn tất hoặc bấm &ldquo;Thiết lập sau&rdquo;, hệ thống lưu cờ vào CSDL để không bao giờ hiện lại popup làm phiền bạn.
                        </p>
                      </div>
                    </div>

                    {/* Dòng Telemetry DecryptedText từ React Bits */}
                    <div className="pt-3 border-t border-[#ECEAE2] text-[10px] font-mono text-[#5A6466] flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span>HOST:</span>
                        <DecryptedText 
                          text="cvat.itup.io.vn" 
                          speed={40} 
                          className="font-bold text-[#2D5A34]"
                        />
                      </div>
                      <span className="text-[#2D5A34] font-bold">PORT 443 TLS OK</span>
                    </div>
                  </SpotlightCard>
                </div>

              </div>
            )}

          </div>
        </div>
      </AnimatedContent>
    </div>
  );
};
